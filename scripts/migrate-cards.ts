// scripts/migrate-cards.ts
import { sb } from './_client';
import cardsJson from '../src/data/cards.json';

async function run() {
    const rows = Object.entries(cardsJson as any).map(([key, c]: any) => ({
        card_id: Number(key),
        character_id: c.characterId,
        card_rarity_type: c.cardRarityType,
        attr: c.attr,
        assetbundle_name: c.assetbundleName ?? null,
    }));

    const BATCH = 100;
    for (let i = 0; i < rows.length; i += BATCH) {
        const { error } = await sb.from('cards').upsert(
            rows.slice(i, i + BATCH),
            { onConflict: 'card_id' }
        );
        if (error) throw error;
        console.log(`cards: ${Math.min(i + BATCH, rows.length)}/${rows.length}`);
    }
    console.log('✅ cards done: 1327 筆');
}

run().catch(console.error);
