import nodemailer from "nodemailer";

// ✅ SMTP Transporter
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

// ✅ Main Function
export async function sendBookingEmail({ type, booking, eventType, timezone = "UTC" }) {

  console.log("EMAIL_ATTEMPT_START");

  console.log("EMAIL_INPUT:", {
    email: booking?.email,
    eventType: !!eventType
  });

  if (!booking?.email || !eventType) {
    console.log("EMAIL_SKIPPED", {
      email: booking?.email,
      eventType: !!eventType
    });
    return { skipped: true };
  }

  const bookingUrl = `${process.env.APP_URL}/book/${eventType.slug}`;
  const details = getBookingDetails({ booking, eventType, timezone, bookingUrl });
  const subject = getSubject(type, eventType.title);
  const intro = getIntro(type, booking.name, eventType.title);

  try {
    console.log("EMAIL_SENDING_TO:", booking.email);

    const info = await transporter.sendMail({
      from: process.env.MAIL_FROM,
      to: booking.email,
      subject,
      html: buildHtmlBody({ intro, details })
    });

    console.log("EMAIL_SENT_SUCCESS:", info.response);

  } catch (err) {
    console.error("EMAIL_SEND_FAILED:", err.message);
  }

  return { skipped: false };
}

// ✅ Subject Logic
function getSubject(type, eventTitle) {
  switch (type) {
    case "cancelled":
      return `Booking cancelled: ${eventTitle}`;
    case "rescheduled":
      return `Booking rescheduled: ${eventTitle}`;
    case "confirmed":
    default:
      return `Booking confirmed: ${eventTitle}`;
  }
}

// ✅ Intro Message
function getIntro(type, guestName, eventTitle) {
  switch (type) {
    case "cancelled":
      return `Hi ${guestName}, your booking for ${eventTitle} has been cancelled.`;
    case "rescheduled":
      return `Hi ${guestName}, your booking for ${eventTitle} has been rescheduled.`;
    case "confirmed":
    default:
      return `Hi ${guestName}, your booking for ${eventTitle} is confirmed.`;
  }
}

// ✅ Booking Details
function getBookingDetails({ booking, eventType, timezone, bookingUrl }) {
  return [
    { label: "Event", value: eventType.title },
    { label: "Who", value: `${booking.name} (${booking.email})` },
    { label: "When", value: formatBookingDateTime(booking.date, booking.time, timezone) },
    { label: "Timezone", value: timezone },
    { label: "Duration", value: `${booking.duration} minutes` },
    { label: "Where", value: bookingUrl },
    { label: "Status", value: capitalize(booking.status || "confirmed") },
    ...(eventType.description ? [{ label: "Details", value: eventType.description }] : [])
  ];
}

// ✅ Date Formatting
function formatBookingDateTime(date, time, timezone) {
  const dateTime = new Date(`${date}T${time}:00`);

  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "full",
    timeStyle: "short",
    timeZone: timezone
  }).format(dateTime);
}

// ✅ Text Body
function buildTextBody({ intro, details }) {
  return `${intro}

${details.map((item) => `${item.label}: ${item.value}`).join("\n")}
`;
}

// ✅ HTML Body
function buildHtmlBody({ intro, details }) {
  return `
    <div style="font-family: Arial, sans-serif; color: #111827; line-height: 1.6;">
      <p>${escapeHtml(intro)}</p>
      <table style="border-collapse: collapse; width: 100%; max-width: 640px;">
        <tbody>
          ${details
            .map(
              (item) => `
                <tr>
                  <td style="padding: 8px 12px; border: 1px solid #e5e7eb; font-weight: 600; width: 140px;">${escapeHtml(item.label)}</td>
                  <td style="padding: 8px 12px; border: 1px solid #e5e7eb;">${escapeHtml(item.value)}</td>
                </tr>
              `
            )
            .join("")}
        </tbody>
      </table>
    </div>
  `;
}

// ✅ Escape HTML
function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

// ✅ Capitalize
function capitalize(value) {
  return value ? value.charAt(0).toUpperCase() + value.slice(1) : value;
}