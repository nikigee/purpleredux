import { SlashCommandBuilder } from '@discordjs/builders';
import { EmbedBuilder } from 'discord.js';
import { evaluate } from 'mathjs';

class SingleDice {
    constructor(string = "d20") {
        this.string = string;
        this.list = [];
        this.stats = SingleDice.cvt(string);
        if (this.stats.iterator > 1000 || this.stats.face > 1000) {
            throw Error("Dice exceeds max limit!");
        }
        this.roll();
    }
    static cvt(diceRoll) {
        diceRoll = diceRoll.toLowerCase();
        let diceObj = {};
        if (diceRoll.includes("->")) {
            diceObj.foreach_modifier = parseInt(diceRoll.split("->")[1]);
        }
        diceRoll = diceRoll.split("d");
        diceObj.iterator = diceRoll[0] != "" ? parseInt(diceRoll[0]) : 1;
        diceObj.face = parseInt(diceRoll[1]);
        if (isNaN(diceObj.iterator) || isNaN(diceObj.face)) {
            throw Error("Invalid dice roll!");
        }
        return diceObj;
    }
    serialise() {
        return `${this.stats.iterator}d${this.stats.face}${this.stats.foreach_modifier ? "->" + this.stats.foreach_modifier : ""}`;
    }
    roll() {
        let num;
        this.list = [];
        for (let i = 0; i < this.stats.iterator; i++) {
            num = Math.floor(Math.random() * this.stats.face) + 1;
            if (this.stats.foreach_modifier)
                num += this.stats.foreach_modifier;
            this.list.push(num);
        }
        return this.total;
    }
    addDice(number) {
        this.stats.iterator += number;
        this.string = this.serialise(this.stats);
        this.roll();
        return this;
    }
    reRoll(value) {
        const index = this.list.indexOf(value);
        if (index != -1) {
            this.list[index] = Math.floor(Math.random() * this.stats.face) + 1;
            return this.list[index];
        }
        return false;
    }
    get total() {
        if (this.stats.iterator <= 0) return 0;
        else return this.list.reduce((a, b) => a + b);
    }
    get max() {
        return this.stats.face * this.stats.iterator;
    }
    get expected() {
        let E = 0;
        for (let i = 1; i <= this.stats.face; i++) {
            E += i;
        }
        E = E / this.stats.face;
        return E * this.stats.iterator;
    }
}

class DiceRoll {
    constructor(dice = "d20") {
        this.dice = dice;
        this.roll();
    }
    generateList() {
        const regexp = /\d*d\d+(?:->\-*\d+)*/g;
        const list = [];
        let val;
        do {
            val = regexp.exec(this.dice);
            if (val) list.push(new SingleDice(val[0]));
        } while (val);
        this.list = list;
    }
    get verboseList() {
        const newList = [];
        this.list.forEach((x) => {
            x.list.forEach((v) => {
                newList.push(v);
            });
        });
        return newList;
    }
    get max() {
        let text = this.dice;
        this.list.forEach((x) => {
            text = text.replace(x.string, x.max);
        });
        return Number(evaluate(text));
    }
    get compText() {
        let text = this.dice;
        this.list.forEach((x) => {
            text = text.replace(x.string, x.total);
        });
        return text;
    }
    get total() {
        return Number(evaluate(this.compText));
    }
    get expected() {
        let text = this.dice;
        this.list.forEach((x) => {
            text = text.replace(x.string, x.expected);
        });
        return Number(evaluate(text));
    }
    roll() {
        this.generateList();
        return this.total;
    }
    show() {
        this.list.forEach((x) => {
            console.log(`Dice Roll (${x.string})`);
            if (x.stats.foreach_modifier) {
                console.log("Modifier (+" + x.stats.foreach_modifier + ")");
            }
            x.list.forEach((x, i) => {
                console.log(`Roll ${i + 1}: ${x}`);
            });
        });
        console.log(`Total = ${this.compText}`);
        console.log("Total roll: " + this.total);
    }
    static r(arg, mute = true) {
        return DiceRoll.x(arg, mute).total;
    }
    static x(arg, mute = true) {
        const dice = new DiceRoll(arg);
        if (!mute) dice.show();
        return dice;
    }
    static cvt(roll) {
        return SingleDice.cvt(roll);
    }
    static diceObj(string) {
        return new SingleDice(string);
    }
}

export const data = new SlashCommandBuilder()
    .setName('roll')
    .setDescription('Rolls some dice in the standard D&D format!')
    .addStringOption(option => option.setName('dice')
        .setDescription('The dice to roll in standard format (e.g., 2d10)')
        .setRequired(true));
export async function execute(interaction) {
    const diceInput = interaction.options.getString('dice');
    const roll = DiceRoll.x(diceInput);

    const embed = new EmbedBuilder()
        .setTitle('🎲 Dice Roll!')
        .setDescription(`Your roll is ${diceInput}. Good luck! <33`)
        .setColor(0x6a0dad)
        .setThumbnail('https://i.imgur.com/MQo7HLm.jpeg');

    if (roll.total === roll.max) {
        embed.setFooter({ text: 'you got it 🥳' });
    } else if (roll.total > (roll.expected + roll.expected / 2)) {
        embed.setFooter({ text: 'nice roll 💕' });
    } else if (roll.total < (roll.expected / 2)) {
        embed.setFooter({ text: 'nice ;\')' });
    }

    if (roll.list.length === 1 && roll.list[0].stats.iterator === 1) {
        embed.addFields({ name: 'Roll:', value: String(roll.total) });
    } else {
        roll.list.forEach((v) => {
            embed.addFields({ name: `${v.string}:`, value: `${v.list.join(' + ')} = ${v.total}`, inline: true });
        });
        if (roll.compText != roll.total) {
            embed.addFields({ name: 'Total Roll:', value: `${roll.compText} = ${roll.total}` });
        } else {
            embed.addFields({ name: 'Total Roll:', value: String(roll.total) });
        }
    }

    await interaction.reply({ embeds: [embed] });
}
