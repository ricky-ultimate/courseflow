![](https://img.shields.io/github/deployments/ricky-ultimate/courseflow/production?style=for-the-badge&logo=vercel&label=DEPLOYMENT&labelColor=%23131820&color=%2364fab6)

# CourseFlow

CourseFlow is an open-source project designed to help universities manage and display departmental course timetables in a centralized and easy-to-navigate web application. This application allows users to search for their university, select their department, and view the relevant timetables.

## 🚀 Getting Started

### Prerequisites

Ensure you have the following installed:

- [Node.js](https://nodejs.org/) (version 14.x or higher)
- [npm](https://www.npmjs.com/)

### Installation

1. **Clone the repository:**

    ```bash
    git clone https://github.com/ricky-ultimate/courseflow.git
    cd courseflow
    ```

2. **Install dependencies:**

    ```
    npm install
    ```

3. **Run the development server:**

    ```
    npm run dev
    ```


    Open [http://localhost:3000](http://localhost:3000) in your browser to see the application.

<br />

## 🏫 Adding Your University Data

If you'd like to contribute by adding your university's timetable data to CourseFlow, please follow the steps below.

### 1. **Create a New Folder**

Navigate to the `src/data/universities/` directory and create a new folder named after your university. The folder name should be lowercase, and spaces should be replaced with hyphens (`-`). For example:

```
src/data/universities/university-of-xyz/
```

### 2. **Create Department Files**

Inside your university folder, create separate `.ts` files for each department. Each file should export a `Department` object. The file name should be lowercase and match the department's `id` field.

Example:

```
src/data/universities/university-of-xyz/cs.ts
```

### 3. **Department File Format**

Each department file should follow this structure:

```
import { Department } from '@/data/universities/types';

export const cs: Department = {
  id: 'cs',
  name: 'Computer Science',
  timetable: {
    '100lvl': [
      {
        day: 'Monday',
        courses: [
          { time: '09:00 - 10:00', code: 'CS101', name: 'Introduction to Computer Science', venue: 'Room 101' },
          { time: '11:00 - 12:00', code: 'CS102', name: 'Data Structures', venue: 'Room 102' },
        ],
      },
      // Add more day schedules as needed
    ],
    '200lvl': [
      // Add timetable data for 200 level courses
    ],
    '300lvl': [],
    '400lvl': [],
    '500lvl': [],
  },
};

export default cs;

```

### 4. **Create an `index.ts` in the University Folder**

Within the university folder, create an `index.ts` file that exports all departments. This file is essential for aggregating all department data and making it available for import in other parts of the application.

```
// src/data/universities/university-of-xyz/index.ts

import cs from './cs';
import bio from './bio';
// Import other departments as needed

export const universityxyz = {
  id: 'university-of-xyz',
  name: 'University of XYZ',
  departments: [cs, bio],  // Include all departments for the university
};

```

### 5. **Importance of `index.ts`**

To ensure your university data is recognized by the application, create or update the `index.ts` file in the `src/data/universities/` directory. This file centralizes all university data for easy access across the application.

Add your university to the `index.ts` file:

```
import { universityxyz } from './university-of-xyz';

const universities = [universityxyz]; // Combine all university data

export default universities;
```

### 6. **Test Your Changes**

After adding your university and department data, run the development server to ensure everything is working correctly:

```
npm run dev
```


## 🛠️ Project Structure

Here's an overview of the key directories and files in the project:

- `src/app/`: Contains the Next.js pages for different routes in the application.
- `src/components/`: Contains reusable React components used throughout the application.
- `src/data/universities/`: Contains the data for each university, including department timetables.
- `src/data/universities/types.ts`: Defines TypeScript types for university and department data structures.
- `src/data/universities/<university-name>/index.ts`: Centralizes all university department data.
- `src/data/universities/index.ts`: Centralizes all university data for the application.

## 🤝 Contributing

We welcome contributions to CourseFlow! If you have any ideas, suggestions, or improvements, feel free to open an issue or submit a pull request.

### How to contribute

- Fork the repository
- Create a new branch: `git checkout -b feature/your-feature-name`
- Commit your changes: `git commit -m 'Add some feature'`
- Push to the branch: `git push origin feature/your-feature-name`
- Open a pull request

<br />

## 🧑‍💻 Maintainers

[Ricky Ultimate](https://github.com/ricky-ultimate)
