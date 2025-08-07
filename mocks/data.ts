import { TreeType } from '@/types/tree';
import { UserType } from '@/types/user';
import { GiftType } from '@/types/gift';
import categories from '@/constants/categories';

export const currentUser: UserType = {
  id: 'user1',
  name: 'Ana García',
  email: 'ana.garcia@example.com',
  avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=crop&w=634&q=80',
  createdAt: '2023-01-01T00:00:00.000Z',
  treeId: 'tree1',
  connections: ['user2', 'user3', 'user4', 'user5'],
};

export const myTree: TreeType = {
  id: 'tree1',
  ownerId: 'user1',
  name: 'Mi Árbol de Vida',
  createdAt: '2023-01-01T00:00:00.000Z',
  branches: [
    {
      id: 'branch1',
      name: 'Familia',
      categoryId: 'family',
      color: '#FF6B35', // Orange as in the image
      createdAt: '2023-01-02T00:00:00.000Z',
      isShared: true,
      sharedWith: ['user2'],
    },
    {
      id: 'branch2',
      name: 'Viajes',
      categoryId: 'travel',
      color: '#4A90E2', // Blue as in the image
      createdAt: '2023-01-03T00:00:00.000Z',
      isShared: false,
    },
    {
      id: 'branch3',
      name: 'Profesión',
      categoryId: 'work',
      color: '#E91E63', // Pink as in the image
      createdAt: '2023-01-05T00:00:00.000Z',
      isShared: false,
    },
    {
      id: 'branch7',
      name: 'Amistad',
      categoryId: 'friends',
      color: '#2ECC71', // Green as in the image
      createdAt: '2023-01-06T00:00:00.000Z',
      isShared: true,
      sharedWith: ['user3'],
    },
    {
      id: 'branch5',
      name: 'Mascotas',
      categoryId: 'pets',
      color: '#17A2B8', // Teal as in the image
      createdAt: '2023-01-07T00:00:00.000Z',
      isShared: false,
    },
    {
      id: 'branch6',
      name: 'Hobbies',
      categoryId: 'hobbies',
      color: '#2ECC71', // Green as in the image
      createdAt: '2023-01-08T00:00:00.000Z',
      isShared: false,
    },
  ],
  fruits: [
    {
      id: 'fruit1',
      title: 'Graduación Universidad',
      description: 'Finalmente me gradué después de tanto esfuerzo',
      branchId: 'branch3',
      mediaUrls: ['https://images.unsplash.com/photo-1523050854058-8df90110c9f1?ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80'],
      createdAt: '2023-05-15T00:00:00.000Z',
      tags: ['graduación', 'logro', 'universidad'],
      location: {
        name: 'Universidad Complutense',
        coordinates: {
          latitude: 40.4474,
          longitude: -3.7284,
        },
      },
      people: ['Mamá', 'Papá', 'Laura'],
      emotions: ['felicidad', 'orgullo'],
      isShared: true,
      sharedWith: ['user2', 'user3'],
    },
    {
      id: 'fruit2',
      title: 'Viaje a Barcelona',
      description: 'Increíble fin de semana en Barcelona con amigos',
      branchId: 'branch2',
      mediaUrls: ['https://images.unsplash.com/photo-1583422409516-2895a77efded?ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80'],
      createdAt: '2023-07-10T00:00:00.000Z',
      tags: ['viaje', 'amigos', 'barcelona'],
      location: {
        name: 'Barcelona',
        coordinates: {
          latitude: 41.3851,
          longitude: 2.1734,
        },
      },
      people: ['Carlos', 'Laura', 'Miguel'],
      emotions: ['diversión', 'aventura'],
      isShared: false,
    },
    {
      id: 'fruit3',
      title: 'Cumpleaños de Mamá',
      description: 'Celebración sorpresa para el cumpleaños 60 de mamá',
      branchId: 'branch1',
      mediaUrls: ['https://images.unsplash.com/photo-1464349095431-e9a21285b5f3?ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80'],
      createdAt: '2023-09-20T00:00:00.000Z',
      tags: ['cumpleaños', 'familia', 'sorpresa'],
      location: {
        name: 'Casa familiar',
      },
      people: ['Mamá', 'Papá', 'Hermanos', 'Tíos'],
      emotions: ['amor', 'felicidad', 'sorpresa'],
      isShared: true,
      sharedWith: ['user2'],
    },
    {
      id: 'fruit4',
      title: 'Adopción de Luna',
      description: 'El día que adoptamos a nuestra gatita Luna del refugio',
      branchId: 'branch5',
      mediaUrls: ['https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80'],
      createdAt: '2023-03-12T00:00:00.000Z',
      tags: ['mascota', 'gato', 'adopción'],
      location: {
        name: 'Refugio de Animales Madrid',
      },
      people: ['Laura'],
      emotions: ['alegría', 'ternura'],
      isShared: false,
    },
  ],
  roots: [
    {
      id: 'root1',
      name: 'Mamá',
      relation: 'mother',
      treeId: 'tree2',
      createdAt: '2023-01-01T00:00:00.000Z',
    },
    {
      id: 'root2',
      name: 'Papá',
      relation: 'father',
      treeId: 'tree3',
      createdAt: '2023-01-01T00:00:00.000Z',
    },
    {
      id: 'root4',
      name: 'Abuela Carmen',
      relation: 'grandmother',
      treeId: 'tree5',
      createdAt: '2023-01-01T00:00:00.000Z',
    },
  ],
};

export const gifts: GiftType[] = [
  {
    id: 'gift1',
    type: 'branch',
    senderId: 'user3',
    senderName: 'Laura',
    recipientId: 'user1',
    message: "¡Estos recuerdos te van a encantar! Momentos increíbles de nuestro viaje.",
    createdAt: '2023-10-15T00:00:00.000Z',
    status: 'pending',
    contentId: 'branch_viaje_barcelona',
    isNew: true,
  },
  {
    id: 'gift2',
    type: 'timeCapsule',
    senderId: 'user2',
    senderName: 'Mamá',
    recipientId: 'user1',
    message: "Se abrirá el día de tu cumpleaños. ¡Es una sorpresa especial!",
    createdAt: '2023-10-10T00:00:00.000Z',
    status: 'pending',
    contentId: 'capsule_cumpleanos_30',
    unlockDate: '2024-01-15T00:00:00.000Z',
    isNew: true,
  },
  {
    id: 'gift3',
    type: 'timeCapsule',
    senderId: 'user4',
    senderName: 'Carlos',
    recipientId: 'user1',
    message: "Para que recuerdes nuestro viaje a Japón cuando volvamos a vernos.",
    createdAt: '2023-09-05T00:00:00.000Z',
    status: 'pending',
    contentId: 'capsule_viaje_japon',
    unlockDate: '2023-12-25T00:00:00.000Z',
    isNew: false,
  },
];

export const recentActivities = [
  {
    id: 'activity1',
    userId: 'user2',
    userName: 'Mamá',
    userInitial: 'M',
    action: 'añadió fotos a la rama "Viajes en familia"',
    timestamp: '2023-10-20T10:30:00.000Z',
    timeAgo: '2 horas',
  },
  {
    id: 'activity2',
    userId: 'user3',
    userName: 'Laura',
    userInitial: 'L',
    action: 'compartió contigo una cápsula del tiempo',
    timestamp: '2023-10-19T15:45:00.000Z',
    timeAgo: '1 día',
  },
  {
    id: 'activity3',
    userId: 'user4',
    userName: 'Papá',
    userInitial: 'P',
    action: 'añadió un nuevo recuerdo a "Vacaciones de verano"',
    timestamp: '2023-10-18T09:15:00.000Z',
    timeAgo: '2 días',
  },
];

export const memories = [
  {
    id: 'memory1',
    title: '¡Hace 3 años empezaste la universidad!',
    description: 'Añade fotos de ese día.',
    date: '2020-10-20T00:00:00.000Z',
  },
  {
    id: 'memory2',
    title: 'Cumpleaños de Mamá en 5 días',
    description: 'Prepara un regalo especial.',
    date: '2023-10-25T00:00:00.000Z',
  },
  {
    id: 'memory3',
    title: 'Aniversario de adopción de Luna',
    description: 'Hoy hace un año que Luna llegó a casa.',
    date: '2023-10-20T00:00:00.000Z',
  },
];