import nodemailer, { Transporter } from 'nodemailer';
import ejs from 'ejs';
import path from 'path';

interface EmailOptions {
    from?: string;
    to: string;
    subject: string;
    template: string;
    data: { [key: string]: any };
    html?: string; // Optional 'html' field
    email?: string;
}

const sendMail = async (options: EmailOptions): Promise<void> => {
    const transporter: Transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: parseInt(process.env.SMTP_PORT || '587'),
        service: process.env.SMTP_SERVICE,
        auth: {
            user: process.env.SMTP_MAIL,
            pass: process.env.SMTP_PASSWORD,
        },
    });

    const { to, subject, template, data, from } = options;

    let html = options.html; // Use provided HTML if available

    if (!html) {
        // Construct the path to the email template
        const templatePath = path.join(__dirname, '../mails', template);

        // Render the email template with EJS
        try {
            html = await ejs.renderFile(templatePath, data);
        } catch (error) {
            console.error("Error rendering EJS: ", error);
            throw error;
        }
    }

    const mailOptions = {
        from: from || process.env.SMTP_MAIL, // Use 'from' if provided, else default
        to: to,
        subject: subject,
        html: html
    };

    try {
        await transporter.sendMail(mailOptions);
    } catch (error) {
        console.error("Error sending email: ", error);
        throw error;
    }
};

export default sendMail;
