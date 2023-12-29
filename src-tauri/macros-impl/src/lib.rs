use proc_macro2::TokenStream;
use quote::format_ident;
use syn::{Expr, ItemFn};

pub fn create_command(attr: TokenStream, item: TokenStream) -> TokenStream {
    let func: ItemFn = syn::parse2(item).expect("failed to parse function");

    let func_name = format_ident!("command_{}", func.sig.ident);
    let func_params = func.sig.inputs.clone();
    let func_call_params = func
        .sig
        .inputs
        .iter()
        .map(|param| match param {
            syn::FnArg::Typed(pat_type) => pat_type.pat.clone(),
            _ => panic!("unsupported function argument type"),
        })
        .collect::<Vec<_>>();
    let func_path = func.sig.ident.clone();

    let return_type: Expr = syn::parse2(attr).expect("failed to parse return type");

    let output = quote::quote! {
        #func

        #[tauri::command]
        #[specta::specta]
        pub async fn #func_name(#func_params) -> std::result::Result<#return_type, String> {
            let result = #func_path(#(#func_call_params),*).await;
            result.map_err(|e| e.to_string())
        }
    };

    output
}

#[cfg(test)]
mod tests {
    use super::*;
    #[test]
    fn test_create_command() {
        let input_fn = quote::quote! {
            pub async fn test_command(state: State<'_>, path: &str) -> Result<()> {
                Ok(())
            }
        };
        let input_type = quote::quote! { () };
        let output = create_command(input_type, input_fn);
        let expected = quote::quote! {
            pub async fn test_command(state: State<'_>, path: &str) -> Result<()> {
                Ok(())
            }

            #[specta::specta]
            #[tauri::command]
            pub async fn command_test_command(state: State<'_>, path: &str) -> std::result::Result<(), String> {
                let result = test_command().await;
                result.map_err(|e| e.to_string())
            }
        };
        assert_eq!(output.to_string(), expected.to_string());
    }
}
