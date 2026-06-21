const API_BASE_URL = "http://127.0.0.1:8000/api/v1";

export async function getDashboardStats() {
  const response = await fetch(`${API_BASE_URL}/dashboard`);

  if (!response.ok) {
    throw new Error("Failed to fetch dashboard statistics");
  }

  return response.json();
}

function getReportQuery(startDate, endDate) {
  const query = new URLSearchParams();

  if (startDate) {
    query.set("start_date", startDate);
  }
  if (endDate) {
    query.set("end_date", endDate);
  }

  const queryString = query.toString();
  return queryString ? `?${queryString}` : "";
}

async function getReportResponse(path, startDate, endDate) {
  const response = await fetch(
    `${API_BASE_URL}/reports/${path}${getReportQuery(startDate, endDate)}`
  );

  if (!response.ok) {
    let message = "Failed to fetch report data";

    try {
      const data = await response.json();
      if (typeof data.detail === "string") {
        message = data.detail;
      }
    } catch {
      // Use the fallback error message for non-JSON responses.
    }

    throw new Error(message);
  }

  return response.json();
}

export function getReportSummary(startDate = "", endDate = "") {
  return getReportResponse("summary", startDate, endDate);
}

export function getReportDetails(startDate = "", endDate = "") {
  return getReportResponse("details", startDate, endDate);
}
