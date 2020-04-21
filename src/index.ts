import * as Discord from 'discord.js';

class Bot {
    private client!: Discord.Client;
    private message!: Discord.Message;

    public start() {
        this.client = new Discord.Client();

        this.client.on('ready', () => {
            console.log('hello world');
        })

        this.client.on('message', async message => {
            this.message = message;

            if (!message.author.bot && this.endsWith('да')) {
                await this.message.channel.send('ПИЗДА');
                await this.message.react('🇱');
                await this.message.react('🇴');
                await this.message.react('🇽');
            }
        })

        this.client.login('NzAyMDQ3NjExMDc4NzA1MTUz.Xp6jqg.KNPa4mdZ8rrq8tJIz2XH_Qa_Ze0');
    }

    private endsWith(ending: string): boolean {
        const regExp: RegExp = new RegExp(`.*${ending}\\W*$`, 'i');

        return regExp.test(this.message.content);
    }
}

const test = new Bot();
test.start();