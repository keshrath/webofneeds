package won.bot.app;

import org.springframework.boot.SpringApplication;

/**
 * Created by fsuda on 14.12.2016.
 */
public class Telegram2WonBotApp {
    public static void main(String[] args) throws Exception {
        SpringApplication app = new SpringApplication(new Object[] { "classpath:/spring/app/telegram2wonBotApp.xml" });
        app.setWebEnvironment(false);
        app.run(args);
        // use for debugging purposes:
        // ConfigurableApplicationContext applicationContext = app.run(args);
        // Thread.sleep(5*60*1000);
        // app.exit(applicationContext);
    }
}
