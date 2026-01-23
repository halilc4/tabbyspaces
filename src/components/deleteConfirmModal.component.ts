import { Component, Input } from '@angular/core'
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap'

@Component({
  selector: 'delete-confirm-modal',
  template: `
    <div class="modal-header">
      <h5 class="modal-title">Delete Workspace</h5>
    </div>
    <div class="modal-body">
      <p>Delete workspace "{{ workspaceName }}"?</p>
      <p class="text-muted">This action cannot be undone.</p>
    </div>
    <div class="modal-footer">
      <button class="btn btn-secondary" (click)="modal.dismiss()">Cancel</button>
      <button class="btn btn-danger" (click)="modal.close()" ngbAutofocus>Delete</button>
    </div>
  `,
})
export class DeleteConfirmModalComponent {
  @Input() workspaceName = ''
  constructor(public modal: NgbActiveModal) {}
}
