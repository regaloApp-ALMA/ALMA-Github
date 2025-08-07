import colors from './colors';

export type CategoryType = {
  id: string;
  name: string;
  color: string;
  icon: string;
};

const categories: CategoryType[] = [
  {
    id: 'family',
    name: 'Familia',
    color: colors.family,
    icon: 'users',
  },
  {
    id: 'travel',
    name: 'Viajes',
    color: colors.travel,
    icon: 'map',
  },
  {
    id: 'work',
    name: 'Profesión',
    color: colors.work,
    icon: 'briefcase',
  },
  {
    id: 'education',
    name: 'Estudios',
    color: colors.education,
    icon: 'book-open',
  },
  {
    id: 'friends',
    name: 'Amistad',
    color: colors.friends,
    icon: 'heart',
  },
  {
    id: 'pets',
    name: 'Mascotas',
    color: colors.pets,
    icon: 'paw',
  },
  {
    id: 'hobbies',
    name: 'Hobbies',
    color: colors.hobbies,
    icon: 'music',
  },
];

export default categories;