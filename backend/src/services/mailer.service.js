import nodemailer from "nodemailer";
import dns from "dns";
dns.setDefaultResultOrder("ipv4first");

let transporterPromise = null;
let missingConfigLogged = false;

function getMailConfig() {
  return {
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT || 587),
    secure: String(process.env.SMTP_SECURE || "false").toLowerCase() === "true",
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
    from: process.env.MAIL_FROM,
    appUrl: (process.env.APP_URL || "http://localhost:8080").replace(/\/$/, "")
  };
}

function hasRequiredConfig(config) {
  return Boolean(config.host && config.port && config.user && config.pass && config.from);
}

async function getTransporter() {
  if (!transporterPromise) {
    transporterPromise = Promise.resolve().then(async () => {
      const config = getMailConfig();

      if (!hasRequiredConfig(config)) {
        if (!missingConfigLogged) {
          console.warn(
            "Mailer is not configured. Set SMTP_HOST, SMTP_PORT, SMTP_SECURE, SMTP_USER, SMTP_PASS, MAIL_FROM, and APP_URL to enable emails."
          );
          missingConfigLogged = true;
        }

        return null;
      }

      const transporter = nodemailer.createTransport({
        host: config.host,
        port: config.port,
        secure: config.secure,
        auth: {
          user: config.user,
          pass: config.pass
        },
        family: 4
      });

      await transporter.verify();
      return transporter;
    }).catch((error) => {
      transporterPromise = null;
      throw error;
    });
  }

  return transporterPromise;
}

export async function sendBookingEmail({ type, booking, eventType, timezone = "UTC" }) {
  const transporter = await getTransporter();

  if (!transporter || !booking?.email || !eventType) {
    return { skipped: true };
  }

  const config = getMailConfig();
  const bookingUrl = `${config.appUrl}/book/${eventType.slug}`;
  const details = getBookingDetails({ booking, eventType, timezone, bookingUrl });
  const subject = getSubject(type, eventType.title);
  const intro = getIntro(type, booking.name, eventType.title);

try {
  await transporter.sendMail({
    from: config.from,
    to: booking.email,
    subject,
    text: buildTextBody({ intro, details }),
    html: buildHtmlBody({ intro, details })
  });
} catch (err) {
  console.error("Failed to send booking email:", err);
}

  return { skipped: false };
}

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

function formatBookingDateTime(date, time, timezone) {
  const dateTime = new Date(`${date}T${time}:00`);

  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "full",
    timeStyle: "short",
    timeZone: timezone
  }).format(dateTime);
}

function buildTextBody({ intro, details }) {
  return `${intro}

${details.map((item) => `${item.label}: ${item.value}`).join("\n")}
`;
}

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

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function capitalize(value) {
  return value ? value.charAt(0).toUpperCase() + value.slice(1) : value;
}
