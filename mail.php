<?php
if ($_SERVER["REQUEST_METHOD"] === "POST") {
    $name = $_POST["name"];
    $email = $_POST["email"];
    $phone = $_POST["phone"];
    $message = $_POST["message"];

    // File upload handling
    $resume = $_FILES["resume"];

    // Recipient email address
    $to = 'recipient@example.com'; // Replace with your email

    // Subject of the email
    $subject = 'New Job Application';

    // Boundary for multipart/form-data
    $boundary = md5(uniqid());

    // Headers
    $headers = "From: $email\r\n";
    $headers .= "Reply-To: $email\r\n";
    $headers .= "MIME-Version: 1.0\r\n";
    $headers .= "Content-Type: multipart/mixed; boundary=\"$boundary\"\r\n";

    // Message body
    $message_body = "--$boundary\r\n";
    $message_body .= "Content-Type: text/html; charset=ISO-8859-1\r\n";
    $message_body .= "Content-Transfer-Encoding: 7bit\r\n\r\n";
    $message_body .= "Name: $name<br>Email: $email<br>Phone: $phone<br>Message: $message\r\n\r\n";

    // Attachment
    $file_contents = file_get_contents($resume["tmp_name"]);
    $file_base64 = base64_encode($file_contents);
    $message_body .= "--$boundary\r\n";
    $message_body .= "Content-Type: application/pdf; name=\"$resume[name]\"\r\n";
    $message_body .= "Content-Transfer-Encoding: base64\r\n";
    $message_body .= "Content-Disposition: attachment; filename=\"$resume[name]\"\r\n\r\n";
    $message_body .= chunk_split($file_base64);

    // Send the email
    mail($to, $subject, $message_body, $headers);

    echo 'Message has been sent';
} else {
    // Redirect to the form page if accessed directly
    header("Location: your_form_page.html");
    exit();
}
?>
