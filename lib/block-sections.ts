export type WorkoutSection = 'warmup' | 'main' | 'cooldown';

interface BlockSectionLike {
    section?: string | null;
    type?: string | null;
}

export function isWarmupBlock(block: BlockSectionLike | null | undefined): boolean {
    if (!block) return false;
    return block.section === 'warmup' || block.type === 'warmup';
}

export function resolvePersistedSection(block: BlockSectionLike | null | undefined): WorkoutSection {
    if (block?.section === 'warmup' || block?.section === 'main' || block?.section === 'cooldown') {
        return block.section;
    }

    if (block?.type === 'warmup') {
        return 'warmup';
    }

    return 'main';
}
