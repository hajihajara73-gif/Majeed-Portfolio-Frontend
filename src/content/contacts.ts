import type { ContactsContent } from '@/types/content'

export const contacts: ContactsContent = {
  eyebrow: 'Contacts',
  heading: 'Get in touch',
  introduction:
    'The form below goes straight to my inbox. Email, GitHub and LinkedIn all reach me too — whichever is easiest.',

  // CONFIRM BEFORE LAUNCH: this list came from the earlier design conversation,
  // not from Mohammed directly. Edit it to match what is actually true, or
  // delete it — it is a public claim about what you are looking for.
  availability: [
    'Internships',
    'Full stack development',
    'Backend engineering',
    'AI projects',
  ],

  // Source: majeed-portfolio-website.netlify.app, where these were already
  // published. Nothing here is newly exposed.
  channels: [
    {
      id: 'email',
      label: 'Email',
      value: 'majeed74905@gmail.com',
      href: 'mailto:majeed74905@gmail.com',
    },
    {
      id: 'github',
      label: 'GitHub',
      value: 'github.com/majeed74905',
      href: 'https://github.com/majeed74905',
    },
    {
      id: 'linkedin',
      label: 'LinkedIn',
      value: 'linkedin.com/in/mohammed-majeed',
      href: 'https://www.linkedin.com/in/mohammed-majeed-a337842a4',
    },
    {
      id: 'phone',
      label: 'Phone',
      // A public number attracts spam. It was already public on the old site,
      // so this is not new exposure — but delete this channel if you would
      // rather route everything through email.
      value: '+91 93619 71840',
      href: 'tel:+919361971840',
    },
  ],

  form: {
    heading: 'Send a message',
    submitLabel: 'Send',
    successMessage: 'Thanks — your message has been sent.',
    // The one runtime call the public site makes. It is configured per
    // deployment rather than hard-coded, because the static site and the API
    // live at different origins — and when it is unset the form says so
    // instead of pretending to have sent.
    endpoint: import.meta.env.VITE_CONTACT_ENDPOINT ?? null,
  },
}
