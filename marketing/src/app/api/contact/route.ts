import { NextResponse } from 'next/server';
import { supabase } from '../../../lib/supabase';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, email, message, company, topic } = body;
    
    // Basic validation
    if (!name || !email || !message || !company || !topic) {
      return NextResponse.json(
        { error: 'Name, email, company, topic, and message are required fields.' },
        { status: 400 }
      );
    }

    // 1. Save to Supabase for persistence
    const { error: supabaseError } = await supabase
      .from('contact_messages')
      .insert([{ name, email, message, company, topic }]);

    if (supabaseError) {
      console.error('Error saving to Supabase:', supabaseError);
    }

    // 2. Send via Brevo API directly (more reliable than SDK in some environments)
    const brevoApiKey = process.env.BREVO_API_KEY?.trim();
    if (brevoApiKey) {
      try {
        console.log('Attempting to send email via Brevo (Marketing)...');
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
            sender: { name: "Revu AI Contact", email: "hi@revuqai.com" },
            to: [{ email: "abrahamcena96@gmail.com", name: "Abraham Cena" }],
            replyTo: { email: email.trim(), name: name.trim() },
            subject: `New Contact Form Submission: ${topic}`,
            htmlContent: `
              <div style="font-family: sans-serif; line-height: 1.5; color: #1e293b;">
                <h2 style="color: #0500e2;">New Contact Form Submission</h2>
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
          console.error('Brevo API Error (Marketing): Status', response.status, JSON.stringify(errorData));
          return NextResponse.json(
            { error: `Email service error: ${errorData.message || 'Unknown error'}` },
            { status: response.status }
          );
        } else {
          console.log('Email sent successfully via Brevo (Marketing).');
        }
      } catch (emailError: any) {
        console.error('Error sending email via Brevo API (marketing):', emailError);
        return NextResponse.json(
          { error: `Connection to email service failed: ${emailError.message}` },
          { status: 500 }
        );
      }
    } else {
      console.warn('BREVO_API_KEY is missing from environment variables (Marketing).');
      return NextResponse.json(
        { error: 'Email service not configured (API key missing)' },
        { status: 500 }
      );
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Message received successfully.' 
    });
  } catch (error) {
    console.error('Contact API Error:', error);
    return NextResponse.json(
      { error: 'Something went wrong. Please try again later.' },
      { status: 500 }
    );
  }
}
