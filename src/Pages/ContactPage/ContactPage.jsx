import React, { useState } from 'react';
import emailjs from 'emailjs-com';
import './ContactPage.scss';
import Nav from '../../Components/Nav/Nav';

function ContactPage() {
  const [formStatus, setFormStatus] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();

    emailjs.sendForm(
      import.meta.env.VITE_EMAILJS_SERVICE_ID,
      import.meta.env.VITE_EMAILJS_TEMPLATE_ID,
      e.target,
      import.meta.env.VITE_EMAILJS_PUBLIC_KEY
    ).then(
      (result) => {
        setFormStatus('Message sent successfully!');
        e.target.reset();
      },
      (error) => {
        setFormStatus('Oops! Something went wrong.');
        console.error(error.text);
      }
    );
  };

  return (
    <> 
    <Nav></Nav>
    <div className="contact-page">
      <h1>Contact Me</h1>
      <p>Send a message and I’ll get back to you as soon as possible.</p>

      <form className="contact-form" onSubmit={handleSubmit}>
        <label>
          Name
          <input type="text" name="name" placeholder="Your Name" required />
        </label>

        <label>
          Email
          <input type="email" name="email" placeholder="Your Email" required />
        </label>

        <label>
          Message
          <textarea name="message" placeholder="Your Message" required />
        </label>

        <button type="submit">Send</button>

        {formStatus && <p className="form-status">{formStatus}</p>}
      </form>
    </div>
    </>
  );
}

export default ContactPage;