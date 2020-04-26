import * as cheerio from 'cheerio';
import axios, { AxiosResponse } from 'axios';
import { Message, TextChannel, DMChannel, NewsChannel, MessageEmbed, MessageAttachment } from 'discord.js';
import * as fs from 'fs';
import * as http from 'https';

class RedditScrapper {
    private $!: CheerioStatic;
    private channel!: TextChannel | DMChannel | NewsChannel;
    private counter: number = 0;

    public async start(message: Message) {
        const command = message.content.split(' ');
        const subreddit = command[0].split('/')[1];
        const count = command[1] ? +command[1] : 0;

        this.channel = message.channel;
        let redditPage: AxiosResponse<any>;

        try {
            redditPage = await axios.get(`https://gateway.reddit.com/desktopapi/v1/subreddits/${subreddit}`);
        } catch(error) {
            message.channel.send('Такого subreddit\'а не существует');
            return;
        }

        // tslint:disable-next-line
        for (let post in redditPage.data.posts) {
            this.getPostData(redditPage.data.posts[post]);

            if (this.counter >= count) {
                this.counter = 0;
                return;
            }
        }
    }

    private async getPostData(post: any) {
        if (post.author === 'redditads' || !(post.media && (post.media.type === 'image' || post.media.type === 'gifvideo'))) {
            return;
        }

        this.counter++;
        const title = post.title;

        if (post.media.type === 'image') {
            const image = post.media.content;

            const imageEmbed = new MessageEmbed()
            .setAuthor(`Posted by ${post.author} ${this.getTime(post.created)}`, 'https://2.bp.blogspot.com/-r3brlD_9eHg/XDz5bERnBMI/AAAAAAAAG2Y/XfivK0eVkiQej2t-xfmlNL6MlSQZkvcEACK4BGAYYCw/s1600/logo%2Breddit.png')
            .setDescription(`**${title}**`)
            .setImage(image)

            this.channel.send(imageEmbed);
        } else {
            const counter = this.counter;
            const file = fs.createWriteStream(`file${counter}.mp4`);
            const request = http.get(post.media.content, response => {
                const stream = response.pipe(file);

                stream.on('finish', () => {
                    const attachment = new MessageAttachment(`file${counter}.mp4`);

                    this.channel.send(post.title, attachment);
                });
            });
        }
    }

    private getTime(created: number) {
        let timePassed = Date.now() - created;

        const ms = timePassed % 1000;
        timePassed = (timePassed - ms) / 1000;
        const secs = timePassed % 60;
        timePassed = (timePassed - secs) / 60;
        const mins = timePassed % 60;
        const hours = (timePassed - mins) / 60;
        const days = Math.floor(hours / 24);

        return days ?
            `${days} day${days > 1 ? 's' : ''} ago` :
            hours ?
                `${hours} hour${hours > 1 ? 's' : ''} ago` :
                `${mins} minute${mins > 1 ? 's' : ''} ago`

    }
}

const redditScrapper = new RedditScrapper();

export default redditScrapper;