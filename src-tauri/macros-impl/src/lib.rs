use proc_macro2::TokenStream;
use quote::format_ident;
use syn::{Expr, ItemFn};

pub fn create_command(_attr: TokenStream, item: TokenStream) -> TokenStream {
    let mut func: ItemFn = syn::parse2(item).expect("failed to parse function");

    let ok_type = match &func.sig.output {
        syn::ReturnType::Type(_, ty) => match **ty {
            syn::Type::Path(ref path) => {
                let segments = &path.path.segments;
                match segments[0].arguments {
                    syn::PathArguments::AngleBracketed(ref args) => match args.args.first() {
                        Some(syn::GenericArgument::Type(ref ty)) => Some(ty.clone()),
                        _ => None,
                    },
                    _ => None,
                }
            }
            _ => None,
        },
        _ => None,
    }
    .expect("failed to parse return type");

    let func_name = func.sig.ident.clone();
    let old_func_name = format_ident!("_{}", func.sig.ident);
    func.sig.ident = old_func_name.clone();
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

    let output = quote::quote! {
        #func

        #[tauri::command]
        #[specta::specta]
        pub async fn #func_name(#func_params) -> std::result::Result<#ok_type, String> {
            let result = #old_func_name(#(#func_call_params),*).await;
            result.map_err(|e| format!("{:#}", e))
        }
    };

    output
}

#[cfg(test)]
mod tests {
    use super::*;
    use pretty_assertions::assert_eq;
    #[test]
    fn test_create_command() {
        let input_fn = quote::quote! {
            pub async fn test_command(state: State<'_>, path: &str) -> Result<()> {
                Ok(())
            }
        };
        let output = create_command(TokenStream::new(), input_fn);
        let expected = quote::quote! {
            pub async fn _test_command(state: State<'_>, path: &str) -> Result<()> {
                Ok(())
            }

            #[tauri::command]
            #[specta::specta]
            pub async fn test_command(state: State<'_>, path: &str) -> std::result::Result<(), String> {
                let result = _test_command(state, path).await;
                result.map_err(|e| format!("{:#}", e))
            }
        };
        assert_eq!(output.to_string(), expected.to_string());
    }
}
