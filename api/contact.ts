import type { VercelRequest, VercelResponse } from '@vercel/node';
import { supabase } from '../lib/supabase';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { name, email, message, company, topic } = req.body;
    
    if (!name || !email || !message || !company || !topic) {
      return res.status(400).json({ error: "All fields are required" });
    }

    // 1. Save to Supabase
    const { error: supabaseError } = await supabase
      .from('contact_messages')
      .insert([{ name, email, message, company, topic }]);

    if (supabaseError) {
      console.error('Error saving to Supabase:', supabaseError);
    }

    // 2. Send via Brevo API directly
    const brevoApiKey = process.env.BREVO_API_KEY?.trim();
    if (brevoApiKey) {
      try {
        console.log('Attempting to send email via Brevo...');
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000); // 10s timeout

        const response = await fetch('https://api.brevo.com/v3/smtp/email', {
          method: 'POST',
          signal: controller.signal,
          headers: {
            'accept': 'application/json',
            'api-key': brevoApiKey,
            'content-type': 'application/json'
          },
          body: JSON.stringify({
            sender: { name: "Revu AI Dashboard", email: "hi@revuqai.com" },
            to: [{ email: "abrahamcena96@gmail.com", name: "Abraham Cena" }],
            replyTo: { email: email.trim(), name: name.trim() },
            subject: `New Dashboard Contact: ${topic}`,
            htmlContent: `
              <div style="font-family: sans-serif; line-height: 1.5; color: #1e293b;">
                <h2 style="color: #0500e2;">New Dashboard Contact Submission</h2>
                <p><strong>Name:</strong> ${name}</p>
                <p><strong>Email:</strong> ${email}</p>
                <p><strong>Company:</strong> ${company}</p>
                <p><strong>Topic:</strong> ${topic}</p>
                <div style="margin-top: 20px; padding: 15px; background-color: #f8fafc; border-radius: 8px;">
                  <p><strong>Message:</strong></p>
                  <p>${message.replace(/\n/g, '<br>')}</p>
                </div>
              </div>
            `
          })
        });
        clearTimeout(timeoutId);

        if (!response.ok) {
          const errorData = await response.json();
          console.error('Brevo API Error (Dashboard): Status', response.status, JSON.stringify(errorData));
          
          if (response.status === 401 && errorData.code === 'unauthorized' && errorData.message?.includes('unrecognised IP address')) {
            return res.status(401).json({ 
              error: "Email service IP restriction",
              message: "Your server IP is not authorized in Brevo. Please add it to your Authorized IPs in Brevo security settings."
            });
          }

          return res.status(response.status).json({ 
            error: `Email service error: ${errorData.message || 'Unknown error'}`,
            details: errorData 
          });
        }
      } catch (emailError: any) {
        console.error('Error sending email via Brevo API (dashboard):', emailError);
        // We still return success if Supabase worked, or maybe we should fail? 
        // Typically we want to know if the email failed.
        return res.status(500).json({ error: `Connection to email service failed: ${emailError.message}` });
      }
    } else {
      console.warn('BREVO_API_KEY is missing from environment variables.');
    }

    return res.status(200).json({ success: true });
  } catch (error: any) {
    console.error("Contact API error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}
