import axios from 'axios';
import { MessageEmbed } from 'discord.js'

function sendGif(message: any) {
    const test = message.content.split(' ').slice(message.content.split(' ').indexOf('gif') + 1).join(' ');
    // axios.get('http://api.giphy.com/v1/gifs/search', {
    //     params: {
    //         api_key: 'EncLy2VZp5VZhT3q4AKA647trnzvcijr',
    //         q: test,
    //         rating: 'r',
    //         limit: 1,
    //         offset: Math.random() * 50
    //     }
    // }).then(response => {
    //     console.log(response.data.data[0], 'dadadadfasdfasdfasdfas');
    //     console.log(response.data.data[0].images.original.url);
    //     // console.log(response.data.data.image_original_url);
    //     // const attachment = new MessageAttachment(response.data.data[0].url);
    //     const embed = new MessageEmbed()
    //         .setImage(response.data.data[0].images.original.url)
    //     message.channel.send(embed);
    // }, err => {
    //     console.log(err, 'error!!!');
    // })
    axios.get('http://api.giphy.com/v1/gifs/random', {
        params: {
            api_key: 'EncLy2VZp5VZhT3q4AKA647trnzvcijr',
            tag: test,
            rating: 'r'
        }
    }).then(response => {
        // console.log(response.data.data.image_original_url);
        // const attachment = new MessageAttachment(response.data.data[0].url);
        const embed = new MessageEmbed()
            .setImage(response.data.data.image_original_url)
        message.channel.send(embed);
    }, err => {
        console.log(err, 'error!!!');
    })
}

export default sendGif;