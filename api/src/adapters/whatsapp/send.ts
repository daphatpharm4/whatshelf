export async function sendWhatsApp(phone: string, text: string) {
  // TODO: Call WhatsApp Cloud messages endpoint with template support
  return { ok: true, phone, text };
}
