import { EmailService } from './EmailService';

const emailService = new EmailService();

emailService.enqueueEmail("rohitkolekar0108@gmail.com");
emailService.enqueueEmail("test2@example.com");
emailService.enqueueEmail("test3@example.com");

setTimeout(() => {
    emailService.enqueueEmail("test4@example.com");
}, 5000);

setTimeout(() => {
    console.log("Log:", emailService.getLog());
}, 15000);
