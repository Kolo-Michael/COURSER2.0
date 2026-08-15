/**
 * Course PDF generator (pdfkit).
 *
 * Renders a read-optimized PDF of a course: a cover page with title/meta/
 * description, then one section per module with its lessons and their study
 * notes. Lesson content is markdown-ish study notes (## headings, - bullets,
 * **bold**, fenced code); this module flattens it to readable plain text
 * (headings stripped to uppercase-ish lead-ins, markdown markers removed,
 * fenced code preserved as monospaced-ish lines). Pure-JS — no browser or
 * native deps — so it runs inside the Vercel serverless runtime.
 */
import PDFDocument from "pdfkit";

export interface PdfLesson {
  title: string;
  duration: string | null;
  content: string | null;
}

export interface PdfModule {
  title: string;
  description: string | null;
  lessons: PdfLesson[];
}

export interface PdfCourse {
  title: string;
  slug: string;
  description: string | null;
  short_description: string | null;
  level: string;
  duration: string | null;
  modules: PdfModule[];
  generatedAt: Date;
}

/** True for the smallest markdown chunks we can drop safely from a PDF. */
function isFenceLine(line: string): boolean {
  return /^```/.test(line.trim());
}

/**
 * Flatten markdown-ish study notes to near-plain text for PDF rendering:
 * drops fenced-code markers (keeps the code lines), strips heading/bullet/
 * ordered-list markers, **bold**, and inline backticks. Blank lines become
 * paragraph breaks.
 */
function flattenNotes(content: string | null): string[] {
  if (!content) return [];
  const lines = content.split("\n");
  const out: string[] = [];
  for (const raw of lines) {
    const line = raw.trim();
    if (!line) {
      out.push("");
      continue;
    }
    if (isFenceLine(line)) continue;
    let clean = line
      .replace(/^#{1,6}\s+/, "")
      .replace(/^[-*]\s+/, "•  ")
      .replace(/^\d+[.)]\s+/, "")
      .replace(/\*\*(.+?)\*\*/g, "$1")
      .replace(/`([^`]+)`/g, "$1");
    // Collapse runs of spaces left over from stripping markers.
    clean = clean.replace(/\s{2,}/g, " ").trim();
    if (clean) out.push(clean);
  }
  return out;
}

/** Render one lesson into the document, auto-wrapping within the margins. */
function renderLesson(doc: PDFKit.PDFDocument, lesson: PdfLesson, index: number): void {
  doc.moveDown(0.6);
  doc
    .font("Helvetica-Bold")
    .fontSize(12)
    .fillColor("#1c1917")
    .text(`Lesson ${index}: ${lesson.title}`, { continued: false });

  if (lesson.duration) {
    doc
      .font("Helvetica-Oblique")
      .fontSize(9)
      .fillColor("#78716c")
      .text(`Estimated time: ${lesson.duration}`);
  }

  const lines = flattenNotes(lesson.content);
  if (lines.length) {
    doc.font("Helvetica").fontSize(10.5).fillColor("#292524");
    let paragraph = "";
    for (const line of lines) {
      if (!line) {
        if (paragraph.trim()) doc.text(paragraph.trim(), { lineGap: 2 });
        paragraph = "";
      } else {
        paragraph = paragraph ? `${paragraph} ${line}` : line;
      }
    }
    if (paragraph.trim()) doc.text(paragraph.trim(), { lineGap: 2 });
  } else {
    doc
      .font("Helvetica-Oblique")
      .fontSize(10)
      .fillColor("#a8a29e")
      .text("No study notes have been published for this lesson yet.");
  }
}

/** Build the course PDF as a Buffer. */
export function generateCoursePdf(course: PdfCourse): Promise<Buffer> {
  return new Promise<Buffer>((resolve, reject) => {
    const doc = new PDFDocument({
      margin: 48,
      bufferPages: true,
      info: {
        Title: course.title,
        Author: "COURSER",
        Subject: course.description || undefined,
      },
    });
    const chunks: Buffer[] = [];
    doc.on("data", (chunk: Buffer) => chunks.push(chunk));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    // --- cover -------------------------------------------------------------
    doc
      .font("Helvetica-Bold")
      .fontSize(26)
      .fillColor("#1c1917")
      .text(course.title, { align: "left" });
    doc.moveDown(0.3);

    const lessonCount = course.modules.reduce(
      (sum, m) => sum + (m.lessons?.length ?? 0),
      0
    );
    const meta = [
      course.level ? `Level: ${course.level}` : null,
      course.duration ? `Duration: ${course.duration}` : null,
      `${course.modules.length} module${course.modules.length === 1 ? "" : "s"}`,
      `${lessonCount} lesson${lessonCount === 1 ? "" : "s"}`,
    ]
      .filter(Boolean)
      .join("   ·   ");
    doc.font("Helvetica").fontSize(11).fillColor("#78716c").text(meta);

    if (course.short_description) {
      doc.moveDown(0.5);
      doc.font("Helvetica-Oblique").fontSize(12).fillColor("#44403c").text(course.short_description);
    }
    if (course.description) {
      doc.moveDown(0.6);
      doc.font("Helvetica").fontSize(11).fillColor("#44403c").text(course.description, { lineGap: 3 });
    }
    doc.moveDown(0.8);
    doc
      .font("Helvetica")
      .fontSize(9)
      .fillColor("#a8a29e")
      .text(
        `Generated for your own learning on ${course.generatedAt.toLocaleDateString(undefined, {
          year: "numeric",
          month: "long",
          day: "numeric",
        })}. Enjoy your reading.`
      );

    // --- modules -----------------------------------------------------------
    course.modules.forEach((module, moduleIndex) => {
      if (moduleIndex > 0) doc.addPage();
      doc.moveDown(0.4);
      doc
        .font("Helvetica-Bold")
        .fontSize(16)
        .fillColor("#0f766e")
        .text(`Module ${moduleIndex + 1}: ${module.title}`);
      if (module.description) {
        doc.moveDown(0.2);
        doc.font("Helvetica-Oblique").fontSize(10.5).fillColor("#57534e").text(module.description);
      }
      doc.moveDown(0.3);
      (module.lessons ?? []).forEach((lesson, lessonIndex) => {
        renderLesson(doc, lesson, lessonIndex + 1);
      });
    });

    // Footer pass over every buffered page (canonical pdfkit pattern — do
    // this AFTER the content so drawing the footer can't re-trigger pages).
    const range = doc.bufferedPageRange();
    for (let i = range.start; i < range.start + range.count; i += 1) {
      doc.switchToPage(i);
      doc.save();
      doc
        .font("Helvetica")
        .fontSize(8)
        .fillColor("#a8a29e")
        .text(`COURSER · ${course.title}`, 48, doc.page.height - 24, {
          width: doc.page.width - 96,
          align: "center",
          lineBreak: false,
        });
      doc.restore();
    }

    doc.end();
  });
}