import { Resend } from "resend";

const FROM = process.env.RESEND_FROM_EMAIL ?? "ApexCard <verify@apexcard.app>";

export async function sendEmail({
  to,
  subject,
  html,
}: {
  to:      string;
  subject: string;
  html:    string;
}): Promise<void> {
  const resend = new Resend(process.env.RESEND_API_KEY);
  const { error } = await resend.emails.send({ from: FROM, to, subject, html });
  if (error) throw new Error(error.message);
}
