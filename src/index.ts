import * as Discord from 'discord.js';
import * as config from '../config.json';
import mute from './commands/mute';
import sendMamaJoke from './commands/sendMamaJoke';
import sendGif from './commands/sendGif';
import quiz from './commands/startQuiz';

class Bot {
    private client!: Discord.Client;
    private message!: Discord.Message;
    private intervalId: any; // TODO: change this ugly any type

    public start() {
        this.client = new Discord.Client();

        this.client.on('ready', () => {
            // tslint:disable-next-line
            console.log(`${this.client.user?.username} has started working`);

            this.client.user?.setActivity('в попенгагене Яночки', { type: "PLAYING" });
        })

        this.client.on('message', async message => {
            this.message = message;

            if (message.author.bot) return;

            if (message.channel.id === '702618066487476335' && !message.content.startsWith('!')) {
                this.message.delete();
            }

            this.sendSillyReply(message);

            if (message.content.includes('gif')) {
                sendGif(message);
                return;
            }

            if (message.content.includes('quiz')) {
                quiz.startQuiz(this.client, message);
                return;
            }

            if (!this.startsWithPrefix()) return;

            const content = message.content.toLowerCase();

            if (content.includes('пошути про маму')) {
                sendMamaJoke(message);
                return;
            }

            if (content.includes('заеби')) {
                this.intervalId = setInterval(() => message.channel.send('<@298456985807093761>'), 3000);
                return;
            }

            if (content.includes('поеби')) {
                const times = content.match(/\d+/);
                if (!times) {
                    message.channel.send('Сколько ебать то, братва?');
                    return;
                }

                if (+times![0] > 20) {
                    message.channel.send('Чет много ебать придется, давай полегче');
                    return;
                }

                for (let i = 0; i < +times![0]; i++) {
                    message.channel.send('<@298456985807093761>')
                }

                return;
            }

            if (content.includes('хватит')) {
                clearInterval(this.intervalId);
                message.channel.send('Ладно пацаны, как скажете');
            }
        })

        this.client.login(config.token);
    }

    private endsWith(ending: string): boolean {
        const regExp: RegExp = new RegExp(`.*${ending}[^а-яА-Яa-zA-Z]*$`, 'i');

        return regExp.test(this.message.content);
    }

    private startsWithPrefix(): boolean {
        return this.message.content.toLowerCase().startsWith(config.prefix);
    }

    private async sendSillyReply(message: any): Promise<void> {
        if (message.author.username === 'German') {
            message.channel.send('Ой да ты вообще ебло завали');
        } else if (!message.author.bot && this.endsWith('да')) {
            await this.message.channel.send('ПИЗДА');
            await message.react('🇱');
            await message.react('🇴');
            await message.react('🇽');
        } else if (!message.author.bot && this.endsWith('нет')) {
            await this.message.channel.send('ПИДОРА ОТВЕТ');
        } else if (/мама германа/i.test(message.content)) {
            message.channel.send('ТУПАЯ ПИЗДА');
        } else if (/образование/i.test(message.content)) {
            message.channel.send('СОСАТЬ');
        } else if (/Марк/i.test(message.content)) {
            mute(message);
        }
    }
}

const test = new Bot();
test.start();