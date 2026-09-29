require('dotenv').config();
const { Client, GatewayIntentBits, EmbedBuilder } = require('discord.js');

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent
    ]
});

const FIVEM_SERVER_URL = 'http://main.imeroleplay.com:30120'; 
const TOKEN = process.env.DISCORD_TOKEN;

client.once('clientReady', () => {
    console.log(`Bot berhasil login sebagai ${client.user.tag}!`);
});

client.on('messageCreate', async message => {
    if (message.author.bot) return;

    // 1. Perintah untuk melihat SEMUA player online: !players
    if (message.content === '!players') {
        try {
            const response = await fetch(`${FIVEM_SERVER_URL}/players.json`, {
                signal: AbortSignal.timeout(5000)
            });
            
            if (!response.ok) {
                return message.reply('❌ Server Ime RP menolak permintaan data eksternal.');
            }
            
            const players = await response.json();
            
            const infoResponse = await fetch(`${FIVEM_SERVER_URL}/info.json`).catch(() => null);
            const info = infoResponse && infoResponse.ok ? await infoResponse.json() : {};
            const maxPlayers = info.vars?.sv_maxclients || '2048';

            if (players.length === 0) {
                return message.reply('🟢 Server online, tetapi tidak ada player yang sedang login saat ini.');
            }

            const playerNames = players.map(p => `• ${p.name} (ID: ${p.id})`).join('\n');
            const description = playerNames.length > 4000 
                ? playerNames.substring(0, 4000) + '\n... dan player lainnya.' 
                : playerNames;

            const embed = new EmbedBuilder()
                .setTitle('🟢 Status Player - IME Roleplay')
                .setDescription(description)
                .setColor('#00FF00')
                .addFields(
                    { name: 'Total Online', value: `${players.length} / ${maxPlayers}`, inline: true }
                )
                .setTimestamp()
                .setFooter({ text: 'Diminta oleh ' + message.author.tag });

            message.reply({ embeds: [embed] });
        } catch (error) {
            console.error("Detail Error:", error.message);
            message.reply('⚠️ **Koneksi Ditolak:** Gagal mengambil data dari server Ime RP.');
        }
    }

    // 2. Perintah BARU untuk MENCARI PLAYER BERDASARKAN NAMA: !cari <nama>
    if (message.content.startsWith('!cari ')) {
        const searchQuery = message.content.slice(6).trim();
        
        if (!searchQuery) {
            return message.reply('⚠️ Harap masukkan nama player yang ingin dicari. Contoh: `!cari John`');
        }

        try {
            const response = await fetch(`${FIVEM_SERVER_URL}/players.json`, {
                signal: AbortSignal.timeout(5000)
            });
            
            if (!response.ok) {
                return message.reply('❌ Gagal terhubung ke server Ime RP.');
            }
            
            const players = await response.json();

            // Melakukan filter nama (tidak case-sensitive, jadi huruf besar/kecil tidak masalah)
            const matchedPlayers = players.filter(p => p.name.toLowerCase().includes(searchQuery.toLowerCase()));

            if (matchedPlayers.length === 0) {
                return message.reply(`❌ Tidak ditemukan player dengan nama yang mengandung **"${searchQuery}"**.`);
            }

            // Format hasil pencarian
            const playerList = matchedPlayers.map(p => `• ${p.name} (ID: ${p.id})`).join('\n');
            const description = playerList.length > 4000 
                ? playerList.substring(0, 4000) + '\n... dan player lainnya.' 
                : playerList;

            const embed = new EmbedBuilder()
                .setTitle(`🔍 Hasil Pencarian: "${searchQuery}"`)
                .setDescription(description)
                .setColor('#0099ff')
                .addFields(
                    { name: 'Ditemukan', value: `${matchedPlayers.length} player`, inline: true }
                )
                .setTimestamp()
                .setFooter({ text: 'Diminta oleh ' + message.author.tag });

            message.reply({ embeds: [embed] });
        } catch (error) {
            console.error("Detail Error:", error.message);
            message.reply('⚠️ Terjadi kesalahan saat mencari data player.');
        }
    }
});

client.login(TOKEN);