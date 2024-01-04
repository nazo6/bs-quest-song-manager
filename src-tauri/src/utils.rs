use sha1::{Digest, Sha1};

pub fn sha1_hash(str: &str) -> String {
    let mut hasher = <Sha1 as Digest>::new();
    hasher.update(str);
    format!("{:x}", hasher.finalize())
}
