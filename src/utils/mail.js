import Mailgen from "mailgen";
import nodemailer from "nodemailer";


const sendEmail = async (options)=>{
    const mailGenerator =  new Mailgen({
        theme: "default",
        product: {
            name: "Task Manager Application",
            link: "http://Task-Manager-application.com",
        }
    })

    const emailTextual = mailGenerator.generatePlaintext(options.mailgenContent);
    const emailHtml = mailGenerator.generate(options.mailgenContent);

   const transporter = nodemailer.createTransport({
        host: process.env.MAILTRAP_HOST,
        port: process.env.MAILTRAP_PORT,
        auth: {
            user: process.env.MAILTRAP_USERNAME,
            pass: process.env.MAILTRAP_PASSWORD,
        }
    })
    const mail = {
        from: "mail.taskmanager@example.com",
        to: options.email,
        subject: options.subject,
        text: emailTextual,
        html: emailHtml
    }
    try {
        await transporter.sendMail(mail);
    } catch (error) {
        console.error("email service fails ", error);
    }

}


const emailVerificationMailgenContent = (username, verificationUrl) =>{
    return {
        body: {
            name: username,
            intro: 'Welcome to our application! We\'re very excited to have you on board.',
            action: {
                instructions: 'To get started with your account, please click here:',
                button: {
                    color: '#22BC66',
                    text: 'Verify your email',
                    link: verificationUrl,
                }
            },
            outro: 'Need help, or have questions? Just reply to this email, we\'d love to help.'
        }
    }
}



const forgotPasswordMailgenContent = (username, passwordResetUrl) =>{
    return {
        body: {
            name: username,
            intro: 'You have requested to reset your password.',
            action: {
                instructions: 'To reset your account, please click here:',
                button: {
                    color: '#d94b4bff',
                    text: 'Reset your password',
                    link: passwordResetUrl,
                }
            },
            outro: 'Need help, or have questions? Just reply to this email, we\'d love to help.'
        }
    }
}


export {
    sendEmail,
    emailVerificationMailgenContent,
    forgotPasswordMailgenContent
}