export const ptBR = {
  app: {
    name: 'PDF',
    building: 'Em construção',
  },
  home: {
    settings: 'Configurações',
    title: 'Fotos em PDF, em segundos.',
    subtitle: 'Sem anúncios, sem conta. Nada sai do seu telefone.',
    dropHint: 'Escolha uma ou várias imagens',
    gallery: 'Escolher da galeria',
    camera: 'Tirar foto',
    formats: 'Formatos aceitos',
    tipTitle: 'Atalho pela galeria',
    tip: 'Selecione as fotos, toque em Compartilhar e escolha PDF.',
    footer: 'Funciona offline · arquivos ficam no aparelho',
  },
} as const;

type Shape<T> = { readonly [K in keyof T]: T[K] extends string ? string : Shape<T[K]> };

/** Formato que todo idioma precisa seguir: as mesmas chaves do pt-BR. */
export type Messages = Shape<typeof ptBR>;
