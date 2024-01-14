require('dotenv').config();
import nodemailer, { Transporter } from 'nodemailer';
import ejs from 'ejs';
import path from 'path';

interface EmailOptions {
    email: string;
    subject: string;
    template: string;
    data: { [key: string]: any };
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

    const { email, subject, template, data } = options;

    // Construct the path to the email template
    const templatePath = path.join(__dirname, '..//mails', template);

    // Debugging: Log the constructed path
    console.log("EJS Template Path: ", templatePath);

    // Render the email template with EJS
    let html;
    try {
        html = await ejs.renderFile(templatePath, data);
    } catch (error) {
        console.error("Error rendering EJS: ", error);
        throw error; // Re-throw the error to handle it in the calling context
    }

    const mailOptions = {
        from: process.env.SMTP_MAIL,
        to: email,
        subject,
        html
    };

    await transporter.sendMail(mailOptions);
};

export default sendMail;
