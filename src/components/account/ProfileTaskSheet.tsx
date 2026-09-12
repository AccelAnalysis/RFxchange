"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";

import styles from "./ProfileTaskSheet.module.css";

export function ProfileTaskSheet({
  title,
  triggerLabel,
  children,
  activateSelector = null,
  hideChildChrome = false,
  tone = "secondary",
}: Readonly<{
  title: string;
  triggerLabel: string;
  children: ReactNode;
  activateSelector?: string | null;
  hideChildChrome?: boolean;
  tone?: "primary" | "secondary";
}>) {
  const dialogRef = useRef<HTMLDialogElement | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!mounted || !dialog || dialog.open) return;
    dialog.showModal();
    if (!activateSelector) return;
    const frame = window.requestAnimationFrame(() => {
      const target = dialog.querySelector<HTMLElement>(activateSelector);
      target?.click();
      target?.focus({ preventScroll: true });
    });
    return () => window.cancelAnimationFrame(frame);
  }, [activateSelector, mounted]);

  const close = () => {
    const dialog = dialogRef.current;
    if (dialog?.open) dialog.close();
    setMounted(false);
  };

  return (
    <>
      <button
        type="button"
        className={tone === "primary" ? styles.primaryTrigger : styles.secondaryTrigger}
        onClick={() => setMounted(true)}
      >
        {triggerLabel}
      </button>
      {mounted ? (
        <dialog
          ref={dialogRef}
          className={styles.dialog}
          aria-labelledby="profile-task-sheet-title"
          onClose={() => setMounted(false)}
          onCancel={() => setMounted(false)}
        >
          <header className={styles.header}>
            <h2 id="profile-task-sheet-title">{title}</h2>
            <button type="button" className={styles.close} onClick={close} aria-label={`Close ${title}`}>
              <span aria-hidden="true">×</span>
            </button>
          </header>
          <div className={styles.body} data-hide-child-chrome={hideChildChrome ? "true" : "false"}>
            {children}
          </div>
        </dialog>
      ) : null}
    </>
  );
}
