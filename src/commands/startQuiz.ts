import axios from 'axios';
import {
    MessageEmbed,
    Client,
    Collection,
    User,
    Snowflake,
    TextChannel,
    MessageReaction,
    EmbedFieldData,
    Message
} from 'discord.js';

interface UserObject {
    id: string;
    data: User;
}

interface Question {
    category: string,
    type: string,
    difficulty: string,
    question: string,
    correct_answer: string,
    incorrect_answers: string[],
    answers: string[]
}

const emojiAnswers = ['🇦', '🇧', '🇨', '🇩'];

class Quiz {
    private participants: UserObject[] = [];
    private questions: Question[] = [];
    private channel!: TextChannel;
    private client!: Client;
    private scores: any = {};
    private currentQuestion!: Question;
    private correctAnswer!: string;
    private quizIsOngoing!: boolean;
    private command!: Message;

    public async startQuiz(client: Client, message: any) {
        if (this.quizIsOngoing) {
            this.channel.send('Квиз уже начат');

            return;
        }

        this.quizIsOngoing = true;
        this.channel = message.channel;
        this.client = client;
        await this.getParticipants(client, message);
    }

    private async getParticipants(client: Client, command: Message): Promise<void> {
        let timeLeft = 60;
        let usersReadyToPlay: number;
        this.command = command;
        const startQuizEmbed = new MessageEmbed()
            .setColor('#29b64e')
            .setAuthor(
                `Квиз начат ${command.author.username} в ${command.author.presence.member?.voice.channel?.name}`,
                command.author.avatarURL() || command.author.defaultAvatarURL
                )
            .setDescription(
                'Мы начинаем подбор участников для межгалактической викторины Марка Апакова! ' +
                'Для того, что принять участие, нажми на 👍 и, если хочешь, перейди в голосовой канал, ' +
                'указанный в заголовке. Также...'
                )
            .addFields(
                {name: 'Если ты __**хост**__ и хочешь завершить подбор игроков, нажми на', value: '⏩', inline: true},
                {name: 'Если ты долбаеб, можешь добавить любую другую эмодзи', value: client.emojis.cache.get('703194339094036510'), inline: true},
                )
            .addField('Викторина начнется автоматически через', `***${timeLeft} секунд***`)
            .setFooter('Всего участников: ')

        const sentMessage = await command.channel.send(startQuizEmbed);

        await sentMessage.react('👍');
        await sentMessage.react('⏩');

        const intervalId = setInterval(() => {
            timeLeft -= 5;

            sentMessage.edit(
                new MessageEmbed()
                    .setColor('#29b64e')
                    .setAuthor(
                        `Квиз начат ${command.author.username} в ${command.author.presence.member?.voice.channel?.name}`,
                        command.author.avatarURL() || command.author.defaultAvatarURL
                        )
                    .setDescription(
                        'Мы начинаем подбор участников для межгалактической викторины Марка Апакова! ' +
                        'Для того, что принять участие, нажми на 👍 и, если хочешь, перейди в голосовой канал, ' +
                        'указанный в заголовке. Также...'
                        )
                    .addFields(
                        {name: 'Если ты __**хост**__ и хочешь завершить подбор игроков, нажми на', value: '⏩', inline: true},
                        {name: 'Если ты долбаеб, можешь добавить любую другую эмодзи', value: client.emojis.cache.get('703194339094036510'), inline: true},
                        )
                    .addField('Викторина начнется автоматически через', `***${timeLeft} секунд***`)
                    .setFooter('Всего участников: ')
            );

            if (timeLeft === 0) clearInterval(intervalId);
        }, 5000);

        let usersReacted: Collection<Snowflake, User> | undefined;
        const collector = sentMessage.createReactionCollector((reaction: any, user) => !user.bot, { time: timeLeft * 1000 });

        collector.on('collect', async (reaction, reactionCollector) => {
            usersReacted = await sentMessage.reactions.cache.get('👍')?.users.fetch();
            usersReacted = usersReacted?.filter((user: any) => !user.bot);

            if (reaction.emoji.name === '⏩' && reactionCollector.username === this.command.author.username) {
                clearInterval(intervalId);
                this.finishPreparations(usersReacted?.size ? usersReacted : false);

                collector.removeAllListeners();
                collector.stop();
            }
        });

        collector.on('end', async (reaction, reactionCollector) => {
            usersReacted = await sentMessage.reactions.cache.get('👍')?.users.fetch();
            usersReacted = usersReacted?.filter((user: any) => !user.bot);

            this.finishPreparations(usersReacted?.size ? usersReacted : false);
        })
    };

    private startQuizFilter = (reaction: any, user: any) => {
        return !user.bot && reaction.emoji.name === '👍';
    }

    private async setQuestions(amount: string): Promise<void> {
        const response = await axios.get(`https://opentdb.com/api.php?amount=${amount}&category=31`);
        this.questions = response.data.results;

        for (const question of this.questions) {
            question.answers = question.incorrect_answers.concat(question.correct_answer);
        }
    }

    private async sendQuestions(): Promise<void> {
        this.currentQuestion = this.questions.pop() as Question; // TODO: fix as Question
        const answersOrder = this.getRandomAnswersOrder();
        const fields = this.getFields(answersOrder);

        const embed = new MessageEmbed()
            .setTitle(this.currentQuestion!.question.replace(/\&quot\;/g,'"'))
            .addFields(fields);

        const message = await this.channel.send(embed);

        await message.react('🇦');
        await message.react('🇧');
        await message.react('🇨');
        await message.react('🇩');

        const reactions = await message.awaitReactions((reaction: any, user: any) => !user.bot, { time: 10000 });
        await this.changeScores(reactions);

        const scoresFields = await this.getScoresFields();

        const scoresEmbed = new MessageEmbed()
            .setTitle('Результаты')
            .addFields(scoresFields);

        this.channel.send(scoresEmbed);

        if (this.questions.length) {
            this.sendQuestions();
        }
    }

    private setScores() {
        for (const participant of this.participants) {
            this.scores[participant.id] = 0;
        }
    }

    private async changeScores(reactions: Collection<string, MessageReaction>) {
        const usersReactedCorrectly = await reactions.get(this.correctAnswer)?.users.fetch(); // TODO: change varialbe name
        const users = usersReactedCorrectly?.entries();

        if (!users) return;

        while (true) {
            const user = users.next().value;

            if (!user) break;

            const [id, data] = user;

            if (data.bot) continue;
            if (this.scores[id] === undefined) continue;

            this.scores[id] = this.scores[id] + 1;
        }
    }

    private getRandomAnswersOrder() {
        let numberArray = [0, 1, 2, 3];
        const randomAnswersArray = [];
        let randomNumber = 0;

        for (let i = 0; i < 4; i++) {
            randomNumber = Math.floor(Math.random() * numberArray.length);
            randomAnswersArray.push(numberArray[randomNumber]);

            if (randomNumber === 0) {
                numberArray.shift()
            } else if (randomNumber === numberArray.length - 1) {
                numberArray.pop();
            } else {
                numberArray = numberArray.slice(0, randomNumber).concat(numberArray.slice(randomNumber + 1));
            }
        }

        return randomAnswersArray;
    }

    private getFields(answersOrder: number[]): EmbedFieldData[] {
        const fields: EmbedFieldData[] = [];

        for (let i = 0; i < 4; i++) {
            fields.push({name: emojiAnswers[i], value: this.currentQuestion!.answers[answersOrder[i]]});

            if (this.currentQuestion.answers[answersOrder[i]] === this.currentQuestion.correct_answer) {
                this.correctAnswer = emojiAnswers[i];
            }
        }

        return fields;
    }

    private async getScoresFields(): Promise<EmbedFieldData[]> {
        const scoresFields: EmbedFieldData[] = [];
        const usersId = Object.keys(this.scores);

        for (const userId of usersId) {
            const user = await this.client.users.fetch(userId);

            scoresFields.push({name: user.username, value: this.scores[userId]});
        }

        return scoresFields;
    }

    private endQuiz() {
        this.participants.length = 0;
        this.quizIsOngoing = false;
    }

    private async finishPreparations(usersReacted: any) {
        if (!usersReacted) {
            this.channel.send('Бля вы если зовете, то хоть по кнопке хуярьте');
            this.channel.send('долбаебы');

            this.quizIsOngoing = false;

            throw 'Not enough players'; // TODO: either make a catch block, or return boolean from function
        }

        const users = usersReacted.entries();

        while (true) {
            const user = users.next().value;

            if (!user) break;

            const [id, data] = user;

            if (data.bot) continue;

            this.participants.push({id, data});
        }

        let reply = 'Текущий состав участников: ';
        for (const participant of this.participants) {
            reply += `<@${participant.id}>, `;
        }

        this.channel.send(reply.slice(0, -2));

        const commandAmountArgument = this.command.content.match(/\d+/);
        const questionsAmount = commandAmountArgument ? commandAmountArgument[0] : '1';

        await this.setQuestions(questionsAmount);
        this.setScores();

        if (this.questions.length) this.sendQuestions();

        this.endQuiz();
    }
}

const quiz = new Quiz();

export default quiz;