import * as fs from 'fs';

function sendMamaJoke(message: any) {
    const user = message.mentions.users.first();

    fs.readFile('./jokes.txt', 'utf8', (err, data) => {
        const lines = data.split('\n');
        let line = lines[Math.floor(Math.random() * lines.length)];

        line = line.replace(/\byo\b/ig, `<@${user.id}>'s`);

        message.channel.send(line);
    })
}

export default sendMamaJoke;