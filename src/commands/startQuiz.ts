import axios from 'axios';
import { MessageEmbed, Client, Collection, User, Snowflake, Message, TextChannel, MessageReaction, EmbedFieldData } from 'discord.js';

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

    public async startQuiz(client: Client, message: any) {
        this.channel = message.channel;
        this.client = client;
        const reply = await this.getParticipants(client, message);

        message.channel.send(reply);

        await this.setQuestions();
        this.setScores();

        if (this.questions.length) this.sendQuestions();
    }

    private getParticipants(client: Client, message: any): Promise<string> {
        const promise: Promise<string> = new Promise(resolve => {
            message.channel.send('Для того, чтобы принять участие в квизе, нажми 👍')
            .then((sentMessage: any) => {
                sentMessage.react('👍');

                sentMessage.awaitReactions(this.startQuizFilter, { time: 5000 })
                    .then((collected: any) => {
                        collected.get('👍').users.fetch()
                            .then((result: Collection<Snowflake, User>) => {
                                const users = result.entries();

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

                                resolve(reply.slice(0, -2));
                            });
                    })
            })
        });

        return promise;
    }

    private startQuizFilter = (reaction: any, user: any) => {
        return !user.bot && reaction.emoji.name === '👍';
    }

    private async setQuestions(): Promise<void> {
        const response = await axios.get('https://opentdb.com/api.php?amount=1&category=31');
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
        this.changeScores(reactions);
        console.log(this.scores);

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
            console.log(user, 'this is user');

            if (!user) break;

            const [id, data] = user;

            if (data.bot) continue;

            this.scores[id]++;
        }


        // while (true) {
        //     const reactionEmoji = reactionEmojis.next().value;

        //     if (!reactionEmoji) return;

        //     const usersReacted = await reactions.get(reactionEmoji)?.users.fetch();
        //     const users = usersReacted?.entries();

        //     if (!users) break;

            // while (true) {
            //     const user = users.next().value;

            //     if (!user) break;

            //     const [id, data] = user;

            //     if (data.bot) continue;

            //     if (this.currentQuestion.correct_answer)
            // }

            // return;
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
            fields.push({name: emojiAnswers[i], value: this.currentQuestion!.answers[answersOrder[i]], inline: true});

            if (this.currentQuestion.answers[answersOrder[i]] === this.currentQuestion.correct_answer) {
                this.correctAnswer = emojiAnswers[i];
            }
        }

        return fields;
    }
}

const quiz = new Quiz();

export default quiz;