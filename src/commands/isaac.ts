import axios from 'axios';
import { MessageEmbed } from 'discord.js';

export default async function isaac(message: any) {
    const firstPlayer = await axios.get('http://api.steampowered.com/ISteamUserStats/GetPlayerAchievements/v0001/?appid=250900&key=FC87B01461572E77D89CDE7420707339&steamid=76561198051449274');
    const secondPlayer = await axios.get('http://api.steampowered.com/ISteamUserStats/GetPlayerAchievements/v0001/?appid=250900&key=FC87B01461572E77D89CDE7420707339&steamid=76561198131860833');

    const firstPlayerAchievements = firstPlayer.data.playerstats.achievements.filter((achievement: any) => achievement.achieved).length;
    const secondPlayerAchievements = secondPlayer.data.playerstats.achievements.filter((achievement: any) => achievement.achieved).length;

    const embed = new MessageEmbed()
        .setTitle('The Binding of Isaac achievements')
        .addFields(
            {name: 'Егор', value: firstPlayerAchievements, inline: true},
            {name: 'Витя', value: secondPlayerAchievements, inline: true}
        )

    message.channel.send(embed);
}