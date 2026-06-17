const API_BASE_URL = "http://localhost:3001";

window.paymentClient = {
  async createPaymentIntent(payload) {
    const response = await fetch(`${API_BASE_URL}/api/payments/intent`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    return parseResponse(response);
  },

  async getPaymentStatus(paymentId) {
    const response = await fetch(`${API_BASE_URL}/api/payments/${paymentId}/status`);
    return parseResponse(response);
  },
};

async function parseResponse(response) {
  const data = await response.json();

  if (!response.ok) {
    const error = new Error(data?.error?.message || "Request failed.");
    error.payload = data;
    throw error;
  }

  return data;
}
