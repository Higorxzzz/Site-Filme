export interface Movie {
  id: number;
  title: string;
  cover: string;
  year: number;
  rating: number;
  genre: string[];
  synopsis: string;
  duration: string;
  trailer?: string;
}

export interface Series extends Omit<Movie, 'duration'> {
  seasons: Season[];
}

export interface Season {
  number: number;
  episodes: Episode[];
}

export interface Episode {
  number: number;
  title: string;
  synopsis: string;
  duration: string;
  thumbnail: string;
}

const genres = ["Ação", "Aventura", "Romance", "Terror", "Comédia", "Drama", "Ficção Científica", "Suspense"];

export const movies: Movie[] = [
  {
    id: 1,
    title: "A Jornada do Herói",
    cover: "https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=400",
    year: 2024,
    rating: 8.5,
    genre: ["Ação", "Aventura"],
    synopsis: "Um guerreiro improvável embarca em uma jornada épica para salvar seu mundo de uma ameaça sombria que emerge das profundezas.",
    duration: "2h 15min"
  },
  {
    id: 2,
    title: "Sombras da Noite",
    cover: "https://images.unsplash.com/photo-1578632767115-351597cf2477?w=400",
    year: 2024,
    rating: 7.8,
    genre: ["Terror", "Suspense"],
    synopsis: "Uma família se muda para uma casa antiga onde descobrem segredos aterrorizantes escondidos nas sombras.",
    duration: "1h 45min"
  },
  {
    id: 3,
    title: "Amor em Paris",
    cover: "https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=400",
    year: 2023,
    rating: 7.2,
    genre: ["Romance", "Drama"],
    synopsis: "Dois estranhos se encontram nas ruas de Paris e vivem um romance inesquecível durante um fim de semana mágico.",
    duration: "1h 55min"
  },
  {
    id: 4,
    title: "Velocidade Máxima",
    cover: "https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=400",
    year: 2024,
    rating: 8.1,
    genre: ["Ação", "Suspense"],
    synopsis: "Um piloto de corrida deve vencer a competição mais perigosa do mundo enquanto enfrenta rivais sem escrúpulos.",
    duration: "2h 05min"
  },
  {
    id: 5,
    title: "O Último Guardião",
    cover: "https://images.unsplash.com/photo-1509347528160-9a9e33742cdb?w=400",
    year: 2023,
    rating: 8.9,
    genre: ["Aventura", "Ficção Científica"],
    synopsis: "Em um futuro distópico, o último guardião da humanidade luta para proteger os sobreviventes de uma invasão alienígena.",
    duration: "2h 30min"
  },
  {
    id: 6,
    title: "Risadas e Lágrimas",
    cover: "https://images.unsplash.com/photo-1514306191717-452ec28c7814?w=400",
    year: 2024,
    rating: 7.5,
    genre: ["Comédia", "Drama"],
    synopsis: "Uma comédia emocionante sobre amizade, família e os altos e baixos da vida cotidiana.",
    duration: "1h 50min"
  },
  {
    id: 7,
    title: "Enigma Mortal",
    cover: "https://images.unsplash.com/photo-1485846234645-a62644f84728?w=400",
    year: 2024,
    rating: 8.3,
    genre: ["Suspense", "Terror"],
    synopsis: "Um detetive investiga uma série de assassinatos misteriosos que seguem um padrão macabro e impossível.",
    duration: "2h 10min"
  },
  {
    id: 8,
    title: "Além das Estrelas",
    cover: "https://images.unsplash.com/photo-1446776899648-aa78eefe8ed0?w=400",
    year: 2023,
    rating: 9.1,
    genre: ["Ficção Científica", "Aventura"],
    synopsis: "Uma expedição espacial descobre um planeta habitável, mas seus segredos podem mudar o destino da humanidade.",
    duration: "2h 40min"
  }
];

export const series: Series[] = [
  {
    id: 101,
    title: "Guardiões do Reino",
    cover: "https://images.unsplash.com/photo-1518676590629-3dcbd9c5a5c9?w=400",
    year: 2023,
    rating: 9.2,
    genre: ["Aventura", "Ação"],
    synopsis: "Em um reino medieval fantástico, guerreiros de diferentes reinos se unem para enfrentar uma ameaça ancestral.",
    seasons: [
      {
        number: 1,
        episodes: Array.from({ length: 10 }, (_, i) => ({
          number: i + 1,
          title: `Episódio ${i + 1}`,
          synopsis: "Um novo capítulo na saga épica dos guardiões.",
          duration: "45min",
          thumbnail: `https://images.unsplash.com/photo-${1518676590629 + i}?w=300`
        }))
      },
      {
        number: 2,
        episodes: Array.from({ length: 10 }, (_, i) => ({
          number: i + 1,
          title: `Episódio ${i + 1}`,
          synopsis: "A batalha continua com mais intensidade.",
          duration: "48min",
          thumbnail: `https://images.unsplash.com/photo-${1518676590629 + i + 100}?w=300`
        }))
      }
    ]
  },
  {
    id: 102,
    title: "Mistérios da Cidade",
    cover: "https://images.unsplash.com/photo-1480714378408-67cf0d13bc1b?w=400",
    year: 2024,
    rating: 8.7,
    genre: ["Suspense", "Drama"],
    synopsis: "Uma detetive investiga crimes complexos em uma metrópole cheia de segredos e conspirações.",
    seasons: [
      {
        number: 1,
        episodes: Array.from({ length: 8 }, (_, i) => ({
          number: i + 1,
          title: `Episódio ${i + 1}`,
          synopsis: "Mais um mistério a ser desvendado.",
          duration: "50min",
          thumbnail: `https://images.unsplash.com/photo-${1480714378408 + i}?w=300`
        }))
      }
    ]
  },
  {
    id: 103,
    title: "Laços do Destino",
    cover: "https://images.unsplash.com/photo-1522962856988-c8e1fa0df07c?w=400",
    year: 2023,
    rating: 8.4,
    genre: ["Romance", "Drama"],
    synopsis: "Histórias entrelaçadas de amor, perda e redenção em uma pequena cidade costeira.",
    seasons: [
      {
        number: 1,
        episodes: Array.from({ length: 12 }, (_, i) => ({
          number: i + 1,
          title: `Episódio ${i + 1}`,
          synopsis: "Conexões inesperadas mudam vidas.",
          duration: "42min",
          thumbnail: `https://images.unsplash.com/photo-${1522962856988 + i}?w=300`
        }))
      }
    ]
  },
  {
    id: 104,
    title: "Horizonte Infinito",
    cover: "https://images.unsplash.com/photo-1419242902214-272b3f66ee7a?w=400",
    year: 2024,
    rating: 9.0,
    genre: ["Ficção Científica", "Aventura"],
    synopsis: "Exploradores espaciais enfrentam os perigos do desconhecido enquanto buscam um novo lar para a humanidade.",
    seasons: [
      {
        number: 1,
        episodes: Array.from({ length: 10 }, (_, i) => ({
          number: i + 1,
          title: `Episódio ${i + 1}`,
          synopsis: "A jornada pelo espaço revela novos desafios.",
          duration: "55min",
          thumbnail: `https://images.unsplash.com/photo-${1419242902214 + i}?w=300`
        }))
      }
    ]
  }
];

// Generate more movies for infinite scroll
for (let i = 9; i <= 50; i++) {
  movies.push({
    id: i,
    title: `Filme ${i}`,
    cover: `https://images.unsplash.com/photo-${1500000000000 + i * 1000}?w=400`,
    year: 2020 + (i % 5),
    rating: 6 + (i % 4),
    genre: [genres[i % genres.length], genres[(i + 1) % genres.length]],
    synopsis: `Uma história fascinante que explora temas profundos de ${genres[i % genres.length].toLowerCase()}.`,
    duration: `${90 + (i % 60)}min`
  });
}

// Generate more series
for (let i = 105; i <= 130; i++) {
  series.push({
    id: i,
    title: `Série ${i}`,
    cover: `https://images.unsplash.com/photo-${1600000000000 + i * 1000}?w=400`,
    year: 2020 + (i % 5),
    rating: 7 + (i % 3),
    genre: [genres[i % genres.length], genres[(i + 2) % genres.length]],
    synopsis: `Uma série envolvente com múltiplas temporadas de ${genres[i % genres.length].toLowerCase()}.`,
    seasons: [
      {
        number: 1,
        episodes: Array.from({ length: 8 + (i % 5) }, (_, j) => ({
          number: j + 1,
          title: `Episódio ${j + 1}`,
          synopsis: "Um episódio emocionante da série.",
          duration: `${40 + (j % 15)}min`,
          thumbnail: `https://images.unsplash.com/photo-${1600000000000 + i * 1000 + j}?w=300`
        }))
      }
    ]
  });
}

export const allGenres = genres;
