---
title: "Git & Version Control Basics"
slug: git-version-control-basics
description: "Track every change to your code with Git: commits, branches, merging, and working with a remote like GitHub."
short_description: "Version your code and collaborate like a professional."
level: beginner
duration: "2 weeks"
category_slug: devops
image_url: /course-covers/git-version-control-basics.svg
is_featured: false
---

[MODULE: Tracking changes]
Turn any folder into a Git repository and record snapshots of your work.

[LESSON: Commits — saving checkpoints | 12 min]
## Overview
Git records snapshots of your project. Each snapshot is a **commit**, and the history is a series of commits you can rewind or compare.

## Your first repo
```bash
git init
git add .
git commit -m "Initial commit"
```

- `git init` creates the repository in the current folder.
- `git add` stages files you want to include.
- `git commit` saves the staged snapshot with a message.

## Inspecting history
- `git status` — what changed since the last commit.
- `git log --oneline` — a compact history.
- `git diff` — the uncommitted changes, line by line.

## Key takeaways
- Commit early and often — small commits are easy to review and revert.
- Write commit messages that say *why*, not just *what*.
- `status`/`log`/`diff` are the three read-only commands you will live in.

[LESSON: Undoing work safely | 12 min]
## Overview
Git's superpower is that almost nothing is truly lost. Knowing the right undo command depends on whether the change is staged or committed.

## The undo toolbox
```bash
git restore file.txt          # discard unstaged edits
git restore --staged file.txt # unstage a file (keep edits)
git revert <commit>           # add a new commit that undoes another
git log --oneline             # find the commit hash you need
```

- `restore` works on the working tree / staging area only.
- `revert` is the safe way to undo *published* history.
- `reset --hard` destroys work — avoid it until you understand it.

## Key takeaways
- Discard unstaged work with `restore`; undo published work with `revert`.
- Always check `git status` before undoing anything.
- Committed history is safe; uncommitted work is fragile.

[MODULE: Branches and remote collaboration]
Work in parallel with branches, then publish and pull with a remote.

[LESSON: Branches — parallel work | 14 min]
## Overview
Branches let you try changes without touching the main line. This is how feature work happens on real teams.

## Branch basics
```bash
git branch feature-login     # create
git checkout feature-login   # switch
git switch -c feature-login  # create + switch in one step
git merge feature-login      # fold it back into the current branch
```

- The default branch is usually `main`.
- `git switch -c <name>` is the modern way to start working.
- Merging brings another branch's commits into the current one.

## Key takeaways
- Make a branch per feature, keep `main` clean.
- `switch -c` creates and moves in one command.
- Merge conflicts happen when two branches edit the same lines — resolve them in your editor.

[LESSON: Working with a remote | 14 min]
## Overview
A remote is a hosted copy of your repository (GitHub, GitLab, etc.). It is how teams share work and how you back up history.

## The daily loop
```bash
git clone <url>      # copy a remote repo locally
git pull             # fetch + merge remote changes
git push             # upload your commits
git push -u origin main  # first push sets the tracking branch
```

- `pull` before `push` keeps you in sync with teammates.
- `git push` rejects when the remote has commits you lack — pull first.
- `.gitignore` keeps secrets and build output out of the repo.

## Key takeaways
- `clone` once, then `pull` + `push` all day.
- Pull before you push to avoid conflicts.
- Never commit secrets — add them to `.gitignore`.