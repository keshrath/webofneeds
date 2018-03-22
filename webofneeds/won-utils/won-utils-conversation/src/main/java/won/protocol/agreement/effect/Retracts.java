package won.protocol.agreement.effect;

import java.net.URI;
import java.util.HashSet;
import java.util.Set;

public class Retracts extends MessageEffect {

	private URI retractedMessageUri;
	
	public Retracts(URI messageUri, URI retractedMessageUri) {
		super(messageUri);
		this.retractedMessageUri = retractedMessageUri;
	}
		
	public URI getRetractedMessageUri() {
		return retractedMessageUri;
	}

	@Override
	public String toString() {
		return "Retracts [retractedMessageUri=" + retractedMessageUri + "]";
	}
	
}
