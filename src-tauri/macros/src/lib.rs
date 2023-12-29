// hontou ha purokku makuro wo tukuru histuyou sonnnani nakatta kedo yatte mitakatta node proc macro
// ni sityatta

use proc_macro::TokenStream;

#[proc_macro_attribute]
pub fn create_command(attr: TokenStream, item: TokenStream) -> TokenStream {
    macros_impl::create_command(attr.into(), item.into()).into()
}
