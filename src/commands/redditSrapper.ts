import * as cheerio from 'cheerio';
import axios from 'axios';
import { Message, TextChannel, DMChannel, NewsChannel, MessageEmbed } from 'discord.js';
import * as fs from 'fs';
import * as http from 'https';

class RedditScrapper {
    private $!: CheerioStatic;
    private channel!: TextChannel | DMChannel | NewsChannel;
    private counter: number = 0;

    public async start(message: Message) {
        const subreddit = message.content.split('/')[1];

        try {
            const redditPage = await axios.get(`https://www.reddit.com/r/${subreddit}/`);
            this.$ = cheerio.load(redditPage.data);
        } catch(error) {
            message.channel.send('Такого subreddit\'а не существует');
            return;
        }

        this.channel = message.channel;

        this.$('#2x-container > div > div > div > div:nth-child(4) > div > div > div > div:nth-child(2) > div:nth-child(3) > div:first-child > div:nth-child(3)').children().each((index, post) => {
            console.log('this runs');
            this.counter++;
            this.getPostData(post);
        });
    }

    private async getPostData(post: CheerioElement) {
        const title = this.$('div > div > div:nth-child(2) > div:nth-child(2) > div:nth-child(2) h3', post);
        const image = this.$('div > div > div:nth-child(2) > div:nth-child(3) > div > div:nth-child(2) img', post);
        const video = this.$('video source', post);

        console.log(title);

        if (!title.length) {
            return;
        }

        if (video.length) {
            const counter = this.counter;
            const file = fs.createWriteStream(`file${counter}.mp4`);
            const request = http.get(video.attr('src')!, response => {
                const stream = response.pipe(file);

                stream.on('finish', () => {
                    const videoEmbed = new MessageEmbed()
                        .setTitle(title.text().replace(/\<.*?\>/g, '').slice(200))
                        .attachFiles([`file${counter}.mp4`])

                    this.channel.send(videoEmbed);
                });
            });

            return;
        }

        const imageEmbed = new MessageEmbed()
            .setTitle(title.text().replace(/\<.*?\>/g, ''))
            .setImage(image.attr('src')!)

        this.channel.send(imageEmbed);
    }
}

const redditScrapper = new RedditScrapper();

export default redditScrapper;