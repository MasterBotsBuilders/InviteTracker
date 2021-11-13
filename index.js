require("dotenv")
const Discord = require("discord.js")
const client = new Discord.Client()
const Data = new Discord.Collection();
const db = require("quick.db")
const keepAlive = require('./server.js')
keepAlive()
const invites = {};
const wait = require('util').promisify(setTimeout);

client.on('ready', async () => {
  console.clear()
  console.log(`${client.user.tag} is online`)
  await wait(1000);
  client.guilds.cache.forEach(g => {
    g.fetchInvites().then(guildInvites => {
      invites[g.id] = guildInvites;
    })
  });
});
const channel_logger_id = require("./config.json").channel_id

client.on("inviteCreate", (invite) => {
     client.guilds.cache.forEach(g => {
    g.fetchInvites().then(guildInvites => {
      invites[g.id] = guildInvites;
    })
  })
});

client.on("inviteDelete", (invite) => {
    client.guilds.cache.forEach(g => {
    g.fetchInvites().then(guildInvites => {
      invites[g.id] = guildInvites;
    })
  })
});


client.on('guildMemberAdd', async member => {
  member.guild.fetchInvites().then(async guildInvites => {
      const ei = invites[member.guild.id];
      invites[member.guild.id] = guildInvites;
      const invite = guildInvites.find(i => ei.get(i.code).uses < i.uses) || member.guild.vanityURLCode
      const inviter = client.users.cache.get(invite.inviter.id);
      if(invite == member.guild.vanityURLCode) {
         description = `${member} joined with vanity code`
         footer = ""
      }
      if (invite.inviter) {
        await db.set(`${member.id}.inviter`, invite.inviter.id);
        let check_data = await db.get(`${invite.inviter.id}.join`)
        if (check_data == null) await db.set(`${invite.inviter.id}.join`, 0)
        let check_leave = await db.get(`${invite.inviter.id}.leave`)
        if (check_leave == null) await db.set(`${invite.inviter.id}.leave`, 0)
        let leave  = await db.get(`${invite.inviter.id}.leave`)
        let join = await db.get(`${invite.inviter.id}.join`)
        join+=1;
        db.set(`${invite.inviter.id}.join`, join)
        description = `
       **${invite.inviter} Profile**
       **Join count**: ${join}
       **Leave count**: ${leave}
       **Total invite count** ${join-leave}
       `
       footer = `${member.user.tag} was invited by ${invite.inviter.tag}`
      }
      let channel = member.guild.channels.cache.find((ch) => ch.id === channel_logger_id);
      const LogEmbed = new Discord.MessageEmbed()
       .setColor("RANDOM")
       .setAuthor(`${member.user.tag} joined!`,member.user.displayAvatarURL({dynamic: true}))
       .setDescription(description)
       .setTimestamp()
       .setFooter(footer)
       channel.send(LogEmbed)
       });
});



client.on("guildMemberRemove",async (member) => {
  let inviter = await db.get(`${member.id}.inviter`)
  let check_data = await db.get(`${inviter}.join`)
  if (check_data == null) await db.set(`${inviter}.join`, 0)
  let check_leave = await db.get(`${inviter}.leave`)
  if (check_leave == null) await db.set(`${inviter}.leave`, 0)
  let leave  = await db.get(`${inviter}.leave`)
  let join = await db.get(`${inviter}.join`)
  var description, footer
  if (!inviter) { 
    description = `${member} just left the server` 
    footer = `${member.user.tag} joined with vanity code`
  } else  {
    description = `
       **${member.guild.members.cache.get(inviter).user.tag} Profile**
       **Join count**: ${join}
       **Leave count**: ${leave}
       **Total invite count** ${join-leave}
       `
    footer = `${member.user.tag} was invited by ${member.guild.members.cache.get(inviter).user.tag}`
  }
  leave+=1
  await db.set(`${inviter}.leave`, leave)
  let channel = member.guild.channels.cache.find((ch) => ch.id === channel_logger_id);
  const LogEmbed = new Discord.MessageEmbed()
    .setColor("RANDOM")
    .setAuthor(`${member.user.tag} left!`,member.user.displayAvatarURL({dynamic: true}))
    .setDescription(description)
    .setTimestamp()
    .setFooter(footer)
  channel.send(LogEmbed)
})
const prefix = require("./config").PREFIX
client.on("message", async (message, args) => {
    if (message.author.bot) return
    let check_data = await db.get(`${message.author.id}.join`)
    if (check_data == null) await db.set(`${message.author.id}.join`, 0)
    let check_leave = await db.get(`${message.author.id}.leave`)
    if (check_leave == null) await db.set(`${message.author.id}.leave`, 0)
    let leave  = await db.get(`${message.author.id}.leave`)
    let join = await db.get(`${message.author.id}.join`)
    if (message.content.replace(/ /g, '').toLowerCase().startsWith(prefix + "invites")) {
       const Embed = new Discord.MessageEmbed()
       .setColor("RANDOM")
       .setAuthor(message.author.tag,message.author.displayAvatarURL({dynamic: true}))
       .setDescription(`**Your invite count is**: ${join-leave}`)
       .setTimestamp()
       message.channel.send(Embed)
    }
})
client.login(process.env.TOKEN);