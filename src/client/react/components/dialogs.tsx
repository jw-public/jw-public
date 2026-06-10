// Imperative React dialogs (Bootstrap 5 markup) — replaces bootbox.
// Each call mounts its own root into document.body and resolves a Promise
// when the dialog closes; stacked dialogs get increasing z-indexes.

import * as React from "react";
import { useEffect, useRef, useState } from "react";
import { createRoot } from "react-dom/client";

let openDialogs = 0;

interface ShellProps {
  title?: string;
  zIndex: number;
  onDismiss: () => void;
  footer?: React.ReactNode;
  children: React.ReactNode;
}

function DialogShell(props: ShellProps): JSX.Element {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        props.onDismiss();
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  return (
    <React.Fragment>
      <div className="modal-backdrop fade show" style={{ zIndex: props.zIndex - 5 }} onClick={props.onDismiss}></div>
      <div className="modal fade show app-modal" style={{ display: "block", zIndex: props.zIndex }} role="dialog" aria-modal="true" tabIndex={-1}>
        <div className="modal-dialog">
          <div className="modal-content">
            {props.title ? (
              <div className="modal-header">
                <h5 className="modal-title">{props.title}</h5>
                <button type="button" className="btn-close" aria-label="Schließen" onClick={props.onDismiss}></button>
              </div>
            ) : null}
            <div className="modal-body">{props.children}</div>
            {props.footer ? <div className="modal-footer">{props.footer}</div> : null}
          </div>
        </div>
      </div>
    </React.Fragment>
  );
}

function mountDialog<T>(render: (close: (result: T) => void, zIndex: number) => React.ReactNode): Promise<T> {
  return new Promise<T>((resolve) => {
    const container = document.createElement("div");
    document.body.appendChild(container);
    const root = createRoot(container);
    openDialogs += 1;
    const zIndex = 1055 + openDialogs * 20;
    let closed = false;
    const close = (result: T) => {
      if (closed) {
        return;
      }
      closed = true;
      openDialogs -= 1;
      // unmount asynchronously — close() is usually called from within a
      // React event handler of this very root.
      setTimeout(() => {
        root.unmount();
        container.remove();
      }, 0);
      resolve(result);
    };
    root.render(<React.Fragment>{render(close, zIndex)}</React.Fragment>);
  });
}

export interface ConfirmOptions {
  title?: string;
  message: React.ReactNode;
  yesLabel?: string;
  noLabel?: string;
  yesVariant?: string; // bootstrap button variant, e.g. "primary" | "warning"
}

export function confirmDialog(options: ConfirmOptions): Promise<boolean> {
  return mountDialog<boolean>((close, zIndex) => (
    <DialogShell
      title={options.title}
      zIndex={zIndex}
      onDismiss={() => close(false)}
      footer={
        <React.Fragment>
          <button type="button" className="btn btn-outline-secondary" onClick={() => close(false)}>
            {options.noLabel ?? "Abbrechen"}
          </button>
          <button type="button" className={`btn btn-${options.yesVariant ?? "primary"}`} autoFocus onClick={() => close(true)}>
            {options.yesLabel ?? "Akzeptieren"}
          </button>
        </React.Fragment>
      }
    >
      {options.message}
    </DialogShell>
  ));
}

export interface PromptOptions {
  title: string;
  submitLabel?: string;
  cancelLabel?: string;
}

function PromptBody(props: { title: string; submitLabel: string; cancelLabel: string; close: (result: string | null) => void; zIndex: number }): JSX.Element {
  const [value, setValue] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  useEffect(() => inputRef.current?.focus(), []);

  const submit = () => props.close(value);

  return (
    <DialogShell
      title={props.title}
      zIndex={props.zIndex}
      onDismiss={() => props.close(null)}
      footer={
        <React.Fragment>
          <button type="button" className="btn btn-outline-secondary" onClick={() => props.close(null)}>
            {props.cancelLabel}
          </button>
          <button type="button" className="btn btn-primary" onClick={submit}>
            {props.submitLabel}
          </button>
        </React.Fragment>
      }
    >
      <form
        onSubmit={(e) => {
          e.preventDefault();
          submit();
        }}
      >
        <input
          ref={inputRef}
          type="text"
          className="form-control app-modal-input"
          value={value}
          onChange={(e) => setValue(e.target.value)}
        />
      </form>
    </DialogShell>
  );
}

// Resolves the entered string, or null when dismissed (bootbox.prompt contract).
export function promptDialog(options: PromptOptions): Promise<string | null> {
  return mountDialog<string | null>((close, zIndex) => (
    <PromptBody
      title={options.title}
      submitLabel={options.submitLabel ?? "Akzeptieren"}
      cancelLabel={options.cancelLabel ?? "Abbrechen"}
      close={close}
      zIndex={zIndex}
    />
  ));
}

export interface ContentDialogOptions {
  title: string;
  // Renders the dialog body; call close() to dismiss the dialog.
  body: (close: () => void) => React.ReactNode;
}

export function contentDialog(options: ContentDialogOptions): Promise<void> {
  return mountDialog<void>((close, zIndex) => (
    <DialogShell title={options.title} zIndex={zIndex} onDismiss={() => close(undefined)} footer={null}>
      {options.body(() => close(undefined))}
    </DialogShell>
  ));
}
