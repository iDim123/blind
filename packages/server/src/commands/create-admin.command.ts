import { Command, CommandRunner, Option } from 'nest-commander';
import { AuthService } from '../auth/auth.service';

interface CreateAdminOptions {
  email: string;
  password: string;
  firstName?: string;
  lastName?: string;
}

@Command({
  name: 'create-admin',
  description: 'Создать администратора',
})
export class CreateAdminCommand extends CommandRunner {
  constructor(private authService: AuthService) {
    super();
  }

  async run(passedParams: string[], options: CreateAdminOptions): Promise<void> {
    try {
      if (!options.email || !options.password) {
        console.error('Необходимо указать --email и --password');
        process.exit(1);
      }

      const user = await this.authService.createAdminUser(
        options.email,
        options.password,
        options.firstName,
        options.lastName,
      );

      console.log('Администратор создан успешно!');
      console.log(`Username: admin`);
      console.log(`Email: ${user.email}`);
    } catch (error) {
      console.error(`Ошибка: ${error.message}`);
      process.exit(1);
    }
  }

  @Option({
    flags: '--email <email>',
    description: 'Email администратора',
    required: true,
  })
  parseEmail(val: string): string {
    return val;
  }

  @Option({
    flags: '--password <password>',
    description: 'Пароль администратора',
    required: true,
  })
  parsePassword(val: string): string {
    return val;
  }

  @Option({
    flags: '--first-name [firstName]',
    description: 'Имя',
  })
  parseFirstName(val: string): string {
    return val;
  }

  @Option({
    flags: '--last-name [lastName]',
    description: 'Фамилия',
  })
  parseLastName(val: string): string {
    return val;
  }
}