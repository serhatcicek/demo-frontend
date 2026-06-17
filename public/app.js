const checkoutForm = document.querySelector("#checkout-form");
const retryButton = document.querySelector("#retry-button");
const statusCard = document.querySelector("#status-card");
const paymentIdValue = document.querySelector("#paymentId");
const paymentStatusValue = document.querySelector("#paymentStatus");
const updatedAtValue = document.querySelector("#updatedAt");
const failureMessageValue = document.querySelector("#failureMessage");
const submitButton = document.querySelector("#submit-button");
const statusLabel = document.querySelector(".status-label");

const state = {
  latestPayload: null,
  activePaymentId: null,
  pollTimer: null,
};

checkoutForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  await createIntentFromForm();
});

retryButton.addEventListener("click", async () => {
  if (!state.latestPayload) {
    return;
  }

  await createIntent(state.latestPayload);
});

async function createIntentFromForm() {
  const formData = new FormData(checkoutForm);
  const payload = {
    orderId: String(formData.get("orderId") || "").trim(),
    amount: Number(formData.get("amount")),
    currency: String(formData.get("currency") || "").trim().toUpperCase(),
    paymentMethodToken: String(formData.get("paymentMethodToken") || "").trim(),
    customer: {
      email: String(formData.get("email") || "").trim(),
    },
  };

  state.latestPayload = payload;
  await createIntent(payload);
}

async function createIntent(payload) {
  clearPollTimer();
  toggleBusy(true);
  retryButton.classList.add("hidden");
  renderStatus({
    paymentId: "-",
    status: "processing",
    updatedAt: new Date().toISOString(),
    failure: null,
    label: "Creating payment intent...",
  });

  try {
    const result = await window.paymentClient.createPaymentIntent(payload);
    state.activePaymentId = result.paymentId;

    renderStatus({
      paymentId: result.paymentId,
      status: result.status,
      updatedAt: "Waiting for first status check",
      failure: null,
      label: `Intent created. Polling in ${result.pollAfterMs} ms.`,
    });

    schedulePoll(result.paymentId, result.pollAfterMs);
  } catch (error) {
    renderRequestError(error);
  } finally {
    toggleBusy(false);
  }
}

async function pollPayment(paymentId) {
  try {
    const result = await window.paymentClient.getPaymentStatus(paymentId);

    renderStatus({
      paymentId: result.paymentId,
      status: result.status,
      updatedAt: result.updatedAt,
      failure: result.failure,
      label: buildLabel(result),
    });

    if (result.status === "processing") {
      schedulePoll(paymentId, 1500);
      return;
    }

    if (result.status === "failed" && result.retryable) {
      retryButton.classList.remove("hidden");
    }
  } catch (error) {
    renderRequestError(error);
  }
}

function schedulePoll(paymentId, delayMs) {
  clearPollTimer();
  state.pollTimer = window.setTimeout(() => {
    pollPayment(paymentId);
  }, delayMs);
}

function clearPollTimer() {
  if (state.pollTimer) {
    window.clearTimeout(state.pollTimer);
    state.pollTimer = null;
  }
}

function renderStatus({ paymentId, status, updatedAt, failure, label }) {
  statusCard.className = `status-card ${status}`;
  statusLabel.textContent = label;
  paymentIdValue.textContent = paymentId;
  paymentStatusValue.textContent = status;
  updatedAtValue.textContent = updatedAt;
  failureMessageValue.textContent = failure ? `${failure.code}: ${failure.message}` : "-";
}

function buildLabel(result) {
  if (result.status === "processing") {
    return "Payment is still processing. Waiting for terminal status...";
  }

  if (result.status === "succeeded") {
    return "Payment completed successfully.";
  }

  if (result.status === "failed") {
    return "Payment failed. You can retry by creating a new intent.";
  }

  return "Payment status updated.";
}

function renderRequestError(error) {
  const details = error.payload?.error?.details || [];
  const detailText = details.length > 0
    ? details.map((item) => `${item.field}: ${item.message}`).join(" | ")
    : "No validation details returned.";

  renderStatus({
    paymentId: state.activePaymentId || "-",
    status: "failed",
    updatedAt: new Date().toISOString(),
    failure: {
      code: error.payload?.error?.code || "request_failed",
      message: detailText,
    },
    label: error.message || "Request failed.",
  });
}

function toggleBusy(isBusy) {
  submitButton.disabled = isBusy;
  submitButton.textContent = isBusy ? "Working..." : "Create payment intent";
}
