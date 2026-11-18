/**
 * AUTH — shared password check for Prashant and Meera
 * Used when saving a session (Riyaz step 3) and when choosing who reviews a recording.
 *
 * The check runs in the browser: it stops one user acting as the other by mistake
 * or casually, not a determined attacker with the anon key.
 */

const USER_HASHES: Record<string, string> = {
    prashant: '08ff26c5a6661c7bcf74134fc684717aabba4a66c2d0cfa06c4be231755c1a91',
    meera:    'ea4198f9dc6c89087fd7a47d6023c65e9eaaf8ed2a219b8fda98f5b5b765ede9',
};

export async function hashPassword(plain: string): Promise<string> {
    const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(plain));
    return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('');
}

/** True when `plain` is the password of `userId`. */
export async function verifyPassword(userId: string, plain: string): Promise<boolean> {
    const expected = USER_HASHES[userId];
    return expected !== undefined && (await hashPassword(plain.trim())) === expected;
}
