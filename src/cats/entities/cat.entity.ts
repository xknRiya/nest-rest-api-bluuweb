import { Breed } from 'src/breeds/entities/breed.entity';
import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  ManyToOne,
} from 'typeorm';

@Entity()
export class Cat {
  // @PrimaryGeneratedColumn()
  @Column({ primary: true, generated: true })
  id: number;

  @Column()
  name: string;

  @Column()
  age: number;

  // @Column()
  // breed: string;

  @ManyToOne(() => Breed, (breed) => breed.id, {
    eager: true,
  })
  // breedId: number;
  breed: Breed;

  @CreateDateColumn()
  createdAt: Date;

  @DeleteDateColumn()
  deletedAt: Date;
}
