import { Message, User } from 'discord.js';

function mute(message: Message): void {
    const user = message.guild?.member(message.mentions.users.first() as User);
    const role = message!.guild!.roles.cache.get('702545443334258759');

    user?.roles.add(role!);
}

export default mute;