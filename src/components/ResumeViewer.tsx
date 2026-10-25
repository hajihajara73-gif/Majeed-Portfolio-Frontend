import { useEffect, useRef } from 'react'
import { useMediaQuery } from '@/hooks/useMediaQuery'

interface Props {
  readonly href: string
  readonly label: string
  readonly onClose: () => void
}

/**
 * The résumé, previewed in place with a download beside it.
 *
 * Built on the native <dialog> with showModal(), same as the certificate
 * viewer: focus trapping, Escape to close, background inerting and the right
 * role semantics come from the element rather than being hand-rolled.
 *
 * The PDF embeds on wide screens only. Mobile browsers routinely refuse to
 * render an embedded PDF, or render it unusably small, so small screens get
 * the open and download actions instead of a broken frame. Both actions are
 * present at every size, so the file is always reachable.
 */
export function ResumeViewer({ href, label, onClose }: Props) {
  const dialogRef = useRef<HTMLDialogElement>(null)
  const canEmbed = useMediaQuery('(min-width: 1024px)')

  useEffect(() => {
    const dialog = dialogRef.current
    if (!dialog) return
    if (!dialog.open) dialog.showModal()

    // A backdrop click closes; a click inside must not.
    const onClick = (event: MouseEvent) => {
      if (event.target === dialog) onClose()
    }
    dialog.addEventListener('click', onClick)
    dialog.addEventListener('close', onClose)
    return () => {
      dialog.removeEventListener('click', onClick)
      dialog.removeEventListener('close', onClose)
    }
  }, [onClose])

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby="resume-title"
      className="w-[min(92vw,900px)] rounded-lg border border-border bg-surface p-0 text-ink backdrop:bg-bg-deep/80 backdrop:backdrop-blur-sm"
    >
      <div className="flex items-start justify-between gap-[var(--space-md)] border-b border-border p-[var(--space-md)]">
        <div>
          <p className="font-mono text-caption uppercase text-gold">Résumé</p>
          <h2 id="resume-title" className="mt-1 text-h3 text-ink">
            Mohammed Majeed J
          </h2>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="rounded-pill border border-border px-[var(--space-sm)] py-1 text-caption text-ink-secondary transition-colors duration-fast ease-standard hover:border-gold hover:text-gold"
        >
          ✕
        </button>
      </div>

      <div className="p-[var(--space-md)]">
        {canEmbed ? (
          <iframe
            src={href}
            title={`${label} preview`}
            className="h-[65vh] w-full rounded-md border border-border bg-bg-deep"
          />
        ) : (
          <p className="max-w-[var(--width-prose)] text-body text-ink-secondary">
            Open or download the PDF below — mobile browsers do not reliably
            display an embedded document.
          </p>
        )}
      </div>

      <div className="flex flex-wrap gap-[var(--space-sm)] border-t border-border p-[var(--space-md)]">
        <a
          href={href}
          // `download` asks the browser to save rather than navigate. The
          // filename is set here so it is not saved under the hashed path.
          download="Mohammed Majeed J - Resume.pdf"
          className="rounded-pill bg-gold px-[var(--space-lg)] py-[var(--space-sm)] text-caption font-medium uppercase text-bg-deep transition-colors duration-fast ease-standard hover:bg-gold-soft"
        >
          Download PDF
        </a>
        <a
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          className="rounded-pill border border-border-strong px-[var(--space-lg)] py-[var(--space-sm)] text-caption uppercase text-ink transition-colors duration-fast ease-standard hover:border-gold hover:text-gold"
        >
          Open in new tab
        </a>
      </div>
    </dialog>
  )
}
