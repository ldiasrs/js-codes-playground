import WppConnect from '@wppconnect-team/wppconnect';


// Connect to WhatsApp Web (will prompt for QR code scanning)
WppConnect.create()
    .then((wpp) => {
        wpp.sendMessage('+555199999999@c.br', 'Hello from JavaScript!');
    })
    .catch((error) => {
        console.error('Error sending message:', error);
    });

async function sendMessage(phoneNumber, message) {
    try {
        await wpp.sendMessage(phoneNumber, message);
        console.log('Message sent successfully!');
    } catch (error) {
        console.error('Error sending message:', error);
    }
}
