// ─── CoraChat: multi-chat AI tutor panel ─────────────────────────────────
// A self-contained chat widget for the Cora study companion. Given a course
// and a signed-in session it renders:
//   * a chat-list sidebar (each chat = one Conversation row)
//   * "New chat" to start a fresh thread
//   * click a chat to continue it (loads its persisted messages)
//   * delete a chat (trash icon, confirm first)
//   * an expand toggle that opens the same widget as a full-screen overlay
// The same component backs both the compact course-page aside and the
// expanded mode, so state (active chat, messages) stays in one place.

import {
  askCora,
  deleteCourseConversation,
  getCourseConversation,
  listCourseConversations,
  type ApiConversationSummary,
  type ApiModule,
} from '@/api/courses'
import type { AuthSession } from '@/auth/session'
import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'

type ChatRole = 'assistant' | 'user'
type ChatMessage = { role: ChatRole; text: string }

const GREETING: ChatMessage = {
  role: 'assistant',
  text: 'Hi, I’m Cora — your AI study companion. Ask me about this course, confusing terms, or what to do next.',
}

type CoraChatProps = {
  courseSlug: string
  courseTitle: string
  session: AuthSession | null
  /** Modules of the course, used by the expanded (full-screen) chat so the
   *  learner can jump to a lesson without closing the chat. */
  modules?: ApiModule[]
  /** Currently open lesson (highlights it in the expanded chat's rail). */
  activeLessonId?: string | null
  /** Navigate to a lesson from inside the expanded chat. */
  onSelectLesson?: (lessonId: string) => void
}

export function CoraChat({
  courseSlug,
  courseTitle,
  session,
  modules = [],
  activeLessonId = null,
  onSelectLesson,
}: CoraChatProps) {
  const [conversations, setConversations] = useState<ApiConversationSummary[]>([])
  const [activeId, setActiveId] = useState<string | null>(null)
  const [chat, setChat] = useState<ChatMessage[]>([GREETING])
  const [question, setQuestion] = useState('')
  const [asking, setAsking] = useState(false)
  const [expanded, setExpanded] = useState(false)
  const [loading, setLoading] = useState(false)
  const transcriptRef = useRef<HTMLDivElement>(null)

  // Load the user's chat list on mount / when the course changes. The most
  // recent conversation becomes the active one so history isn't lost on
  // reload. Non-fatal if the API is unreachable (greeting still shows).
  useEffect(() => {
    if (!session || !courseSlug) return
    let active = true
    setLoading(true)
    listCourseConversations(courseSlug)
      .then((list) => {
        if (!active) return
        setConversations(list)
        if (list.length > 0) {
          const latest = list[0]
          setActiveId(latest.id)
          return getCourseConversation(courseSlug, latest.id).then((messages) => {
            if (!active) return
            setChat(messages.length ? messages.map((m) => ({ role: m.role, text: m.content })) : [GREETING])
          })
        }
      })
      .catch(() => {
        // Fresh (empty) chat — keep the greeting.
      })
      .finally(() => {
        if (active) setLoading(false)
      })
    return () => {
      active = false
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session, courseSlug])

  // Auto-scroll the transcript to the newest message whenever it changes.
  useEffect(() => {
    const node = transcriptRef.current
    if (node) node.scrollTop = node.scrollHeight
  }, [chat, asking, loading])

  // While the expanded chat is open, lock the background page scroll so the
  // chat space stays put and the page behind it never moves. Restored on
  // close/unmount.
  useEffect(() => {
    if (!expanded) return
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = prev
    }
  }, [expanded])

  // Open an existing conversation and load its full history.
  async function openConversation(id: string) {
    if (id === activeId) return
    setActiveId(id)
    setLoading(true)
    try {
      const messages = await getCourseConversation(courseSlug, id)
      setChat(messages.length ? messages.map((m) => ({ role: m.role, text: m.content })) : [GREETING])
    } catch {
      setChat([GREETING])
    } finally {
      setLoading(false)
    }
  }

  // Start a brand-new chat: clears the active thread and shows the greeting.
  function startNewChat() {
    setActiveId(null)
    setChat([GREETING])
    setQuestion('')
  }

  // Delete a chat after confirm. If it was the active one, fall back to a
  // fresh thread. The list refreshes from the server afterwards.
  async function handleDelete(id: string) {
    if (!window.confirm('Delete this chat? Its history will be removed.')) return
    try {
      await deleteCourseConversation(courseSlug, id)
      setConversations((prev) => prev.filter((c) => c.id !== id))
      if (activeId === id) startNewChat()
    } catch (err) {
      window.alert(err instanceof Error ? err.message : 'Could not delete this chat.')
    }
  }

  // Ask Cora: when a conversation is active we continue it (conversation_id
  // is sent), otherwise the backend creates a new chat and we add it to the
  // list and make it active. The optimistic user bubble shows instantly.
  async function handleSend() {
    const trimmed = question.trim()
    if (!trimmed || asking) return
    setChat((prev) => [...prev, { role: 'user', text: trimmed }])
    setQuestion('')
    setAsking(true)
    try {
      const reply = await askCora(courseSlug, trimmed, activeId)
      setChat((prev) => [...prev, { role: 'assistant', text: reply.answer }])
      if (!activeId) {
        // Brand-new chat: insert it at the top of the list and select it.
        const summary: ApiConversationSummary = {
          id: reply.conversation_id,
          title: trimmed.length > 60 ? `${trimmed.slice(0, 60)}…` : trimmed,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          message_count: 2,
        }
        setConversations((prev) => [summary, ...prev])
        setActiveId(reply.conversation_id)
      } else {
        // Continuing a chat: bump it to the top of the list.
        setConversations((prev) => {
          const target = prev.find((c) => c.id === reply.conversation_id)
          if (!target) return prev
          const rest = prev.filter((c) => c.id !== reply.conversation_id)
          return [{ ...target, updated_at: new Date().toISOString(), message_count: target.message_count + 2 }, ...rest]
        })
      }
    } catch (err) {
      setChat((prev) => [
        ...prev,
        { role: 'assistant', text: err instanceof Error ? err.message : "Cora couldn't reach the tutor service. Try again." },
      ])
    } finally {
      setAsking(false)
    }
  }

  // One shared transcript+input block, reused by both compact and expanded
  // modes so the two layouts never drift apart.
  const transcript = (
    <div
      ref={transcriptRef}
      className="flex-1 space-y-2 overflow-y-auto"
      aria-live="polite"
      role="log"
      aria-label="Cora chat history"
    >
      {loading && chat.length <= 1 ? (
        <p className="rounded-lg bg-stone-100 p-3 text-sm text-stone-500 dark:bg-stone-800 dark:text-stone-400">
          <i className="fa-solid fa-spinner mr-2 text-xs" aria-hidden />
          Loading chats…
        </p>
      ) : null}
      {chat.map((msg, idx) => (
        <p
          key={idx}
          className={[
            'rounded-lg p-3 text-sm',
            msg.role === 'assistant'
              ? 'bg-stone-100 text-stone-700 dark:bg-stone-800 dark:text-stone-200'
              : 'bg-primary/10 text-primary dark:bg-primary/20 dark:text-primary-dark',
          ].join(' ')}
        >
          {msg.text}
        </p>
      ))}
      {asking ? (
        <p className="rounded-lg bg-stone-100 p-3 text-sm text-stone-500 dark:bg-stone-800 dark:text-stone-400">
          <i className="fa-solid fa-spinner mr-2 text-xs" aria-hidden />
          Cora is thinking…
        </p>
      ) : null}
    </div>
  )

  const inputBox = (
    <form
      className="flex gap-2"
      onSubmit={(e) => {
        e.preventDefault()
        handleSend()
      }}
    >
      <label htmlFor="ask-cora" className="sr-only">
        Ask Cora a question
      </label>
      <input
        id="ask-cora"
        type="text"
        value={question}
        onChange={(e) => setQuestion(e.target.value)}
        placeholder="Ask Cora a question…"
        disabled={asking}
        className="min-w-0 flex-1 rounded-lg border border-stone-200 bg-white px-3 py-2 text-sm text-stone-800 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/25 disabled:opacity-60 dark:border-stone-700 dark:bg-stone-900 dark:text-stone-100 dark:focus:border-primary-dark dark:focus:ring-primary-dark/25"
      />
      <button
        type="submit"
        disabled={asking || !question.trim()}
        className="rounded-lg bg-primary px-3 text-sm font-semibold text-white shadow-sm transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-primary-dark"
      >
        <i className="fa-solid fa-paper-plane" aria-hidden />
      </button>
    </form>
  )

  // Chat-list rows shared by compact + expanded modes.
  const chatList = (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between border-b border-stone-200/70 pb-3 dark:border-stone-700/60">
        <p className="text-sm font-bold text-stone-900 dark:text-stone-50">
          <i className="fa-solid fa-comments mr-2 text-primary dark:text-primary-dark" aria-hidden />
          Chats
        </p>
        <button
          type="button"
          onClick={startNewChat}
          className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-2.5 py-1.5 text-xs font-semibold text-white shadow-sm transition hover:brightness-110 dark:bg-primary-dark"
        >
          <i className="fa-solid fa-plus" aria-hidden />
          New chat
        </button>
      </div>
      {conversations.length === 0 ? (
        <p className="mt-3 text-xs text-stone-500 dark:text-stone-400">
          No saved chats yet — ask your first question to start one.
        </p>
      ) : (
        <ul className="mt-3 flex-1 space-y-1 overflow-y-auto">
          {conversations.map((conv) => (
            <li key={conv.id}>
              <div
                className={[
                  'group flex w-full items-center gap-2 rounded-lg border p-2 text-left transition',
                  activeId === conv.id
                    ? 'border-primary bg-primary/5 ring-1 ring-primary/30 dark:border-primary-dark dark:bg-primary-dark/10'
                    : 'border-stone-200/70 hover:border-stone-300 dark:border-stone-700 dark:hover:border-stone-600',
                ].join(' ')}
              >
                <button type="button" onClick={() => openConversation(conv.id)} className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-semibold text-stone-800 dark:text-stone-200">
                    {conv.title}
                  </span>
                  <span className="block text-[11px] text-stone-500 dark:text-stone-400">
                    {conv.message_count} message{conv.message_count === 1 ? '' : 's'}
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => handleDelete(conv.id)}
                  aria-label={`Delete chat: ${conv.title}`}
                  className="shrink-0 rounded-md p-1.5 text-stone-400 transition hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/40 dark:hover:text-red-400"
                >
                  <i className="fa-solid fa-trash-can text-xs" aria-hidden />
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  )

  // Compact layout: shown inside the course workspace aside.
  if (!expanded) {
    return (
      <div className="mt-5 flex h-[28rem] max-h-[calc(100vh-20rem)] flex-col overflow-hidden rounded-xl border border-stone-200/70 bg-white/70 p-4 shadow-sm backdrop-blur-md dark:border-stone-700/60 dark:bg-stone-900/70">
        <div className="mb-3 flex items-center justify-between gap-2">
          <p className="flex items-center gap-2 text-sm font-bold text-stone-900 dark:text-stone-50">
            <i className="fa-solid fa-robot text-primary dark:text-primary-dark" aria-hidden />
            Cora tutor
          </p>
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={startNewChat}
              aria-label="Start a new chat"
              className="rounded-md p-1.5 text-stone-500 transition hover:bg-stone-200 hover:text-stone-800 dark:text-stone-400 dark:hover:bg-stone-700 dark:hover:text-stone-100"
            >
              <i className="fa-solid fa-pen-to-square" aria-hidden />
            </button>
            <button
              type="button"
              onClick={() => setExpanded(true)}
              aria-label="Expand Cora chat"
              className="rounded-md p-1.5 text-stone-500 transition hover:bg-stone-200 hover:text-stone-800 dark:text-stone-400 dark:hover:bg-stone-700 dark:hover:text-stone-100"
            >
              <i className="fa-solid fa-expand" aria-hidden />
            </button>
          </div>
        </div>

        {/* Scrollable recent-chat strip so chats stay reachable in compact mode. */}
        {conversations.length > 0 ? (
          <div className="mb-2 flex gap-1.5 overflow-x-auto pb-1">
            {conversations.slice(0, 6).map((conv) => (
              <button
                key={conv.id}
                type="button"
                onClick={() => openConversation(conv.id)}
                className={[
                  'shrink-0 rounded-full border px-2.5 py-1 text-[11px] font-semibold transition',
                  activeId === conv.id
                    ? 'border-primary bg-primary text-white dark:bg-primary-dark'
                    : 'border-stone-200 text-stone-600 hover:border-stone-300 dark:border-stone-700 dark:text-stone-300',
                ].join(' ')}
              >
                {conv.title.length > 18 ? `${conv.title.slice(0, 18)}…` : conv.title}
              </button>
            ))}
          </div>
        ) : null}

        {transcript}
        <div className="mt-3">{inputBox}</div>
      </div>
    )
  }

  // Expanded layout: full-screen overlay with the chat list on the left.
  // Rendered through a portal onto document.body — the compact workspace is
  // nested inside frosted-glass cards (backdrop-blur + overflow-hidden) that
  // would otherwise act as a containing block and clip/overlap the fixed
  // overlay. Portal = the overlay always covers the full viewport.
  if (expanded) {
    return createPortal(
      <div
        className="fixed inset-0 z-[100] flex flex-col bg-white dark:bg-stone-950"
        role="dialog"
        aria-modal="true"
        aria-label="Cora tutor — full screen"
      >
      <div className="flex items-center justify-between border-b border-stone-200 px-4 py-3 dark:border-stone-800">
        <p className="flex items-center gap-2 font-bold text-stone-900 dark:text-stone-50">
          <span className="relative flex h-8 w-8 items-center justify-center rounded-full bg-primary">
            <span className="absolute left-2 top-2.5 h-1 w-1 rounded-full bg-white" />
            <span className="absolute right-2 top-2.5 h-1 w-1 rounded-full bg-white" />
            <span className="absolute bottom-2.5 left-1/2 h-0.5 w-3 -translate-x-1/2 rounded-full bg-accent" />
          </span>
          Cora tutor
          <span className="text-sm font-normal text-stone-500 dark:text-stone-400">{courseTitle}</span>
        </p>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={startNewChat}
            className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-sm font-semibold text-white shadow-sm transition hover:brightness-110 dark:bg-primary-dark"
          >
            <i className="fa-solid fa-plus" aria-hidden />
            New chat
          </button>
          <button
            type="button"
            onClick={() => setExpanded(false)}
            aria-label="Close expanded chat"
            className="rounded-md p-2 text-stone-500 transition hover:bg-stone-100 hover:text-stone-800 dark:text-stone-400 dark:hover:bg-stone-800 dark:hover:text-stone-100"
          >
            <i className="fa-solid fa-compress" aria-hidden />
          </button>
        </div>
      </div>
      <div className="flex min-h-0 flex-1">
        {/* Minimized module navigator: stays visible on the left of the chat
           so the learner can jump lessons without closing the tutor. Collapsed
           to a slim rail by default; the active module's lessons expand on
           hover/click. */}
        {modules.length > 0 ? (
          <aside className="hidden w-60 shrink-0 overflow-y-auto border-r border-stone-200 bg-stone-50/60 p-3 sm:block dark:border-stone-800 dark:bg-stone-900/40" aria-label="Course modules">
            <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-stone-500 dark:text-stone-400">
              <i className="fa-solid fa-list-ul" aria-hidden />
              Modules
            </p>
            <ul className="mt-2 space-y-1">
              {modules.map((module) => {
                const lessons = module.lessons ?? []
                const isActive = lessons.some((lesson) => lesson.id === activeLessonId)
                return (
                  <li key={module.id}>
                    <div className="rounded-lg border border-stone-200/70 dark:border-stone-700">
                      <button
                        type="button"
                        className={[
                          'flex w-full items-center gap-2 px-2.5 py-2 text-left text-xs font-semibold transition',
                          isActive
                            ? 'text-primary dark:text-primary-dark'
                            : 'text-stone-700 hover:text-stone-900 dark:text-stone-300 dark:hover:text-stone-100',
                        ].join(' ')}
                      >
                        <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded bg-primary/10 text-[10px] text-primary dark:bg-primary/20 dark:text-primary-dark">
                          {module.order}
                        </span>
                        <span className="truncate">{module.title}</span>
                      </button>
                      {lessons.length > 0 ? (
                        <ul className="border-t border-stone-200/60 px-2 py-1 dark:border-stone-700/60">
                          {lessons.map((lesson) => {
                            const selected = lesson.id === activeLessonId
                            return (
                              <li key={lesson.id}>
                                <button
                                  type="button"
                                  onClick={() => onSelectLesson?.(lesson.id)}
                                  className={[
                                    'flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-xs transition',
                                    selected
                                      ? 'bg-primary/10 font-semibold text-primary dark:bg-primary/20 dark:text-primary-dark'
                                      : 'text-stone-600 hover:bg-stone-200/60 hover:text-stone-800 dark:text-stone-400 dark:hover:bg-stone-800 dark:hover:text-stone-100',
                                  ].join(' ')}
                                >
                                  {lesson.is_completed ? (
                                    <i className="fa-solid fa-check w-3 text-[10px] text-green-600 dark:text-green-400" aria-hidden />
                                  ) : (
                                    <span className="w-3 text-[10px] text-stone-400">{lesson.order}.</span>
                                  )}
                                  <span className="truncate">{lesson.title}</span>
                                </button>
                              </li>
                            )
                          })}
                        </ul>
                      ) : null}
                    </div>
                  </li>
                )
              })}
            </ul>
          </aside>
        ) : null}
        <aside className="hidden w-72 shrink-0 border-r border-stone-200 bg-stone-50/60 p-4 sm:block dark:border-stone-800 dark:bg-stone-900/40">
          {chatList}
        </aside>
        <div className="flex min-w-0 flex-1 flex-col p-4">
          <div className="mx-auto flex h-full w-full max-w-3xl flex-col">
            {transcript}
            <div className="mt-4">{inputBox}</div>
          </div>
        </div>
      </div>
      </div>,
      document.body,
    )
  }
}