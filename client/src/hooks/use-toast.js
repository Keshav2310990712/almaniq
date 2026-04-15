import * as React from "react";

const TOAST_LIMIT = 1;
const TOAST_REMOVE_DELAY = 1000000;

let count = 0;
let state = { toasts: [] };

const listeners = [];
const timeouts = new Map();

function generateId() {
  count = (count + 1) % Number.MAX_SAFE_INTEGER;
  return count.toString();
}

function notify() {
  listeners.forEach((listener) => listener(state));
}

function removeToast(toastId) {
  state = {
    ...state,
    toasts: toastId == null
      ? []
      : state.toasts.filter((toast) => toast.id !== toastId)
  };
  notify();
}

function queueRemoval(toastId) {
  if (!toastId || timeouts.has(toastId)) {
    return;
  }

  const timeout = setTimeout(() => {
    timeouts.delete(toastId);
    removeToast(toastId);
  }, TOAST_REMOVE_DELAY);

  timeouts.set(toastId, timeout);
}

function dismiss(toastId) {
  if (toastId) {
    queueRemoval(toastId);
  } else {
    state.toasts.forEach((toast) => queueRemoval(toast.id));
  }

  state = {
    ...state,
    toasts: state.toasts.map((toast) =>
      toastId == null || toast.id === toastId
        ? { ...toast, open: false }
        : toast
    )
  };

  notify();
}

function updateToast(nextToast) {
  state = {
    ...state,
    toasts: state.toasts.map((toast) =>
      toast.id === nextToast.id ? { ...toast, ...nextToast } : toast
    )
  };

  notify();
}

function toast(props) {
  const id = generateId();

  const dismissToast = () => dismiss(id);
  const update = (nextProps) => updateToast({ ...nextProps, id });

  state = {
    ...state,
    toasts: [
      {
        ...props,
        id,
        open: true,
        onOpenChange: (open) => {
          if (!open) {
            dismissToast();
          }
        }
      },
      ...state.toasts
    ].slice(0, TOAST_LIMIT)
  };

  notify();

  return {
    id,
    dismiss: dismissToast,
    update
  };
}

function useToast() {
  const [localState, setLocalState] = React.useState(state);

  React.useEffect(() => {
    listeners.push(setLocalState);

    return () => {
      const index = listeners.indexOf(setLocalState);
      if (index !== -1) {
        listeners.splice(index, 1);
      }
    };
  }, []);

  return {
    ...localState,
    toast,
    dismiss
  };
}

export { useToast, toast };
